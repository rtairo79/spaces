import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  const { reservationId } = await params;

  try {
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
        programType: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Calculate check-in window
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const reservationDate = reservation.date.toISOString().split('T')[0];

    const [startHour, startMin] = reservation.startTime.split(':').map(Number);
    const reservationStartTime = new Date(reservation.date);
    reservationStartTime.setHours(startHour, startMin, 0, 0);

    const gracePeriod = reservation.room.bookingRule?.gracePeriodMinutes ?? 15;
    const checkInWindowStart = new Date(reservationStartTime.getTime() - 15 * 60 * 1000);
    const checkInWindowEnd = new Date(reservationStartTime.getTime() + gracePeriod * 60 * 1000);

    let canCheckIn = false;
    let checkInMessage = '';

    if (reservation.checkInStatus === 'CHECKED_IN') {
      checkInMessage = 'Already checked in';
    } else if (reservation.checkInStatus === 'AUTO_RELEASED' || reservation.checkInStatus === 'NO_SHOW') {
      checkInMessage = 'Reservation has been released';
    } else if (reservation.status !== 'APPROVED') {
      checkInMessage = `Reservation is ${reservation.status.toLowerCase()}`;
    } else if (reservationDate !== today) {
      checkInMessage = 'Check-in is only available on the day of reservation';
    } else if (now < checkInWindowStart) {
      const minutesUntil = Math.ceil((checkInWindowStart.getTime() - now.getTime()) / 60000);
      checkInMessage = `Check-in opens in ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}`;
    } else if (now > checkInWindowEnd) {
      checkInMessage = 'Check-in window has closed';
    } else {
      canCheckIn = true;
      checkInMessage = 'Ready to check in';
    }

    return NextResponse.json({
      reservation: {
        id: reservation.id,
        room: reservation.room.name,
        location: reservation.location.name,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        checkInStatus: reservation.checkInStatus,
        checkedInAt: reservation.checkedInAt,
        requesterName: reservation.requesterName,
        programType: reservation.programType.name,
      },
      checkInWindow: {
        start: checkInWindowStart.toISOString(),
        end: checkInWindowEnd.toISOString(),
        gracePeriodMinutes: gracePeriod,
      },
      canCheckIn,
      message: checkInMessage,
    });
  } catch (error) {
    console.error('Error fetching check-in status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
