import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if room exists and is active
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        timeSlots: true,
      },
    });

    if (!room || !room.active) {
      return NextResponse.json(
        { available: false, reason: 'Room not available' },
        { status: 200 }
      );
    }

    // Check if requested time is within room's time slots
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();

    const timeSlot = room.timeSlots.find(
      (slot) =>
        slot.dayOfWeek === dayOfWeek &&
        slot.startTime <= startTime &&
        slot.endTime >= endTime
    );

    if (!timeSlot) {
      return NextResponse.json(
        { available: false, reason: 'Room not available at this time' },
        { status: 200 }
      );
    }

    // Check for conflicts with existing reservations
    const conflict = await prisma.reservation.findFirst({
      where: {
        roomId: id,
        date: new Date(date),
        status: {
          in: ['PENDING', 'APPROVED'],
        },
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

    if (conflict) {
      return NextResponse.json(
        {
          available: false,
          reason: 'Room already booked for this time slot',
          conflictingReservation: {
            startTime: conflict.startTime,
            endTime: conflict.endTime,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
