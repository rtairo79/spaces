import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const walkInSchema = z.object({
  roomId: z.string(),
  locationId: z.string(),
  programTypeId: z.string(),
  duration: z.number().min(15).max(120),
  requesterName: z.string().min(1),
  requesterEmail: z.string().email(),
  requesterPhone: z.string().optional(),
  originalReservationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const data = walkInSchema.parse(body);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Round up to nearest 15 minutes for start time
    const roundedStart = Math.ceil(currentMinutes / 15) * 15;
    const startTime = minutesToTime(roundedStart);
    const endTime = minutesToTime(roundedStart + data.duration);

    // Verify room is still available
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        roomId: data.roomId,
        date: new Date(today),
        status: { in: ['PENDING', 'APPROVED'] },
        checkInStatus: { notIn: ['AUTO_RELEASED', 'NO_SHOW'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: 'Room is no longer available for this time' },
        { status: 409 }
      );
    }

    // Get user ID if logged in, otherwise use a system user
    let userId = session?.user?.id;

    if (!userId) {
      // Find or create a walk-in system user
      let systemUser = await prisma.user.findFirst({
        where: { email: 'walkin@system.local' },
      });

      if (!systemUser) {
        systemUser = await prisma.user.create({
          data: {
            email: 'walkin@system.local',
            name: 'Walk-in System',
            password: '',
            role: 'PATRON',
          },
        });
      }

      userId = systemUser.id;
    }

    // Create the walk-in reservation
    const reservation = await prisma.reservation.create({
      data: {
        roomId: data.roomId,
        locationId: data.locationId,
        programTypeId: data.programTypeId,
        date: new Date(today),
        startTime,
        endTime,
        status: 'APPROVED', // Walk-ins are auto-approved
        checkInStatus: 'CHECKED_IN', // Already checked in
        checkedInAt: now,
        isWalkIn: true,
        originalReservationId: data.originalReservationId || null,
        requesterName: data.requesterName,
        requesterEmail: data.requesterEmail,
        requesterPhone: data.requesterPhone || '',
        termsAccepted: true,
        termsAcceptedAt: now,
        createdById: userId,
        approvedAt: now,
      },
      include: {
        room: {
          include: { location: true },
        },
        location: true,
        programType: true,
      },
    });

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        room: reservation.room.name,
        location: reservation.location.name,
        date: today,
        startTime,
        endTime,
        isWalkIn: true,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating walk-in:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
