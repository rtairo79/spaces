import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const checkInSchema = z.object({
  reservationId: z.string(),
  override: z.boolean().optional(), // Staff can override late check-ins
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { reservationId, override = false } = checkInSchema.parse(body);

    // Fetch the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        room: {
          include: {
            bookingRule: true,
            location: true,
          },
        },
        location: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Check if already checked in
    if (reservation.checkInStatus === 'CHECKED_IN') {
      return NextResponse.json(
        { error: 'Already checked in', checkedInAt: reservation.checkedInAt },
        { status: 400 }
      );
    }

    // Check if reservation was released or no-show
    if (reservation.checkInStatus === 'AUTO_RELEASED' || reservation.checkInStatus === 'NO_SHOW') {
      return NextResponse.json(
        { error: 'This reservation has been released and is no longer valid' },
        { status: 400 }
      );
    }

    // Check if reservation is approved
    if (reservation.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Cannot check in - reservation status is ${reservation.status}` },
        { status: 400 }
      );
    }

    // Calculate check-in window
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const reservationDate = reservation.date.toISOString().split('T')[0];

    if (reservationDate !== today) {
      return NextResponse.json(
        { error: 'Check-in is only available on the day of your reservation' },
        { status: 400 }
      );
    }

    const [startHour, startMin] = reservation.startTime.split(':').map(Number);
    const reservationStartTime = new Date(now);
    reservationStartTime.setHours(startHour, startMin, 0, 0);

    const gracePeriod = reservation.room.bookingRule?.gracePeriodMinutes ?? 15;
    const checkInWindowStart = new Date(reservationStartTime.getTime() - 15 * 60 * 1000); // 15 min before
    const checkInWindowEnd = new Date(reservationStartTime.getTime() + gracePeriod * 60 * 1000);

    // Check if within check-in window (unless staff override)
    const isStaff = session?.user?.role === 'STAFF' || session?.user?.role === 'ADMIN';

    if (!override || !isStaff) {
      if (now < checkInWindowStart) {
        const minutesUntil = Math.ceil((checkInWindowStart.getTime() - now.getTime()) / 60000);
        return NextResponse.json(
          {
            error: 'Check-in not yet available',
            message: `Check-in opens ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''} before your reservation`,
            checkInWindowStart: checkInWindowStart.toISOString(),
          },
          { status: 400 }
        );
      }

      if (now > checkInWindowEnd) {
        return NextResponse.json(
          {
            error: 'Check-in window has closed',
            message: 'Your reservation may have been released. Please contact staff for assistance.',
          },
          { status: 400 }
        );
      }
    }

    // Perform check-in
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        checkInStatus: 'CHECKED_IN',
        checkedInAt: now,
        checkedInById: session?.user?.id || null,
      },
      include: {
        room: {
          include: {
            location: true,
          },
        },
        location: true,
        programType: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully checked in',
      reservation: {
        id: updatedReservation.id,
        room: updatedReservation.room.name,
        location: updatedReservation.location.name,
        date: updatedReservation.date,
        startTime: updatedReservation.startTime,
        endTime: updatedReservation.endTime,
        checkedInAt: updatedReservation.checkedInAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    console.error('Error during check-in:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
