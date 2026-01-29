import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const validateSchema = z.object({
  roomId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  excludeReservationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, date, startTime, endTime, excludeReservationId } = validateSchema.parse(body);

    // Check if room exists and is active
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        timeSlots: true,
        bookingRule: true,
        location: true,
      },
    });

    if (!room || !room.active) {
      return NextResponse.json({
        valid: false,
        error: 'Room not available',
        alternativeSlots: [],
      });
    }

    // Check room availability status
    if (room.availabilityStatus !== 'AVAILABLE') {
      return NextResponse.json({
        valid: false,
        error: `Room is currently ${room.availabilityStatus.toLowerCase().replace('_', ' ')}`,
        alternativeSlots: [],
      });
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
      return NextResponse.json({
        valid: false,
        error: 'Room not available at this time',
        alternativeSlots: await findAlternativeSlots(roomId, date, startTime, endTime),
      });
    }

    // Check booking rules
    if (room.bookingRule) {
      const durationMinutes = calculateDurationMinutes(startTime, endTime);
      if (durationMinutes > room.bookingRule.maxDurationMinutes) {
        return NextResponse.json({
          valid: false,
          error: `Maximum booking duration is ${room.bookingRule.maxDurationMinutes} minutes`,
          alternativeSlots: [],
        });
      }

      const daysInAdvance = Math.ceil(
        (requestedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysInAdvance > room.bookingRule.maxAdvanceDays) {
        return NextResponse.json({
          valid: false,
          error: `Bookings can only be made up to ${room.bookingRule.maxAdvanceDays} days in advance`,
          alternativeSlots: [],
        });
      }
    }

    // Check for conflicts with existing reservations
    const conflictQuery: Record<string, unknown> = {
      roomId,
      date: new Date(date),
      status: {
        in: ['PENDING', 'APPROVED'],
      },
      checkInStatus: {
        notIn: ['AUTO_RELEASED', 'NO_SHOW'],
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
    };

    if (excludeReservationId) {
      conflictQuery.id = { not: excludeReservationId };
    }

    const conflict = await prisma.reservation.findFirst({
      where: conflictQuery,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        requesterName: true,
      },
    });

    if (conflict) {
      const alternatives = await findAlternativeSlots(roomId, date, startTime, endTime);
      return NextResponse.json({
        valid: false,
        error: 'Time slot conflicts with an existing reservation',
        conflictingReservation: {
          id: conflict.id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          requesterName: conflict.requesterName,
        },
        alternativeSlots: alternatives,
      });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }
    console.error('Error validating reservation:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

async function findAlternativeSlots(
  roomId: string,
  date: string,
  preferredStartTime: string,
  preferredEndTime: string
): Promise<Array<{ date: string; startTime: string; endTime: string; score: number; reason: string }>> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { timeSlots: true },
  });

  if (!room) return [];

  const requestedDate = new Date(date);
  const dayOfWeek = requestedDate.getDay();
  const duration = calculateDurationMinutes(preferredStartTime, preferredEndTime);
  const alternatives: Array<{ date: string; startTime: string; endTime: string; score: number; reason: string }> = [];

  // Get room's time slots for today
  const todaySlots = room.timeSlots.filter(slot => slot.dayOfWeek === dayOfWeek);

  for (const slot of todaySlots) {
    // Get all reservations for this date
    const reservations = await prisma.reservation.findMany({
      where: {
        roomId,
        date: new Date(date),
        status: { in: ['PENDING', 'APPROVED'] },
        checkInStatus: { notIn: ['AUTO_RELEASED', 'NO_SHOW'] },
      },
      orderBy: { startTime: 'asc' },
    });

    // Find gaps between reservations
    const gaps = findAvailableGaps(slot.startTime, slot.endTime, reservations, duration);

    for (const gap of gaps) {
      // Skip if this is the same as the requested time
      if (gap.startTime === preferredStartTime) continue;

      const hourDiff = Math.abs(
        timeToMinutes(gap.startTime) - timeToMinutes(preferredStartTime)
      ) / 60;

      alternatives.push({
        date,
        startTime: gap.startTime,
        endTime: gap.endTime,
        score: Math.max(0, 100 - hourDiff * 10),
        reason: hourDiff <= 1 ? 'Close to your preferred time' : 'Same day alternative',
      });
    }
  }

  // Also check the next few days
  for (let i = 1; i <= 3; i++) {
    const nextDate = new Date(requestedDate);
    nextDate.setDate(nextDate.getDate() + i);
    const nextDayOfWeek = nextDate.getDay();
    const nextDateStr = nextDate.toISOString().split('T')[0];

    const nextDaySlots = room.timeSlots.filter(slot => slot.dayOfWeek === nextDayOfWeek);

    for (const slot of nextDaySlots) {
      // Check if preferred time is available on this day
      const conflict = await prisma.reservation.findFirst({
        where: {
          roomId,
          date: nextDate,
          status: { in: ['PENDING', 'APPROVED'] },
          OR: [
            {
              AND: [
                { startTime: { lte: preferredStartTime } },
                { endTime: { gt: preferredStartTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: preferredEndTime } },
                { endTime: { gte: preferredEndTime } },
              ],
            },
          ],
        },
      });

      if (!conflict) {
        alternatives.push({
          date: nextDateStr,
          startTime: preferredStartTime,
          endTime: preferredEndTime,
          score: Math.max(0, 90 - i * 15),
          reason: `Same time, ${i} day${i > 1 ? 's' : ''} later`,
        });
      }
    }
  }

  // Sort by score and return top 5
  return alternatives
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function findAvailableGaps(
  slotStart: string,
  slotEnd: string,
  reservations: Array<{ startTime: string; endTime: string }>,
  minDuration: number
): Array<{ startTime: string; endTime: string }> {
  const gaps: Array<{ startTime: string; endTime: string }> = [];
  let currentStart = timeToMinutes(slotStart);
  const slotEndMinutes = timeToMinutes(slotEnd);

  // Sort reservations by start time
  const sorted = [...reservations].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  for (const res of sorted) {
    const resStart = timeToMinutes(res.startTime);
    const resEnd = timeToMinutes(res.endTime);

    if (resStart > currentStart) {
      const gapDuration = resStart - currentStart;
      if (gapDuration >= minDuration) {
        gaps.push({
          startTime: minutesToTime(currentStart),
          endTime: minutesToTime(currentStart + minDuration),
        });
      }
    }
    currentStart = Math.max(currentStart, resEnd);
  }

  // Check gap after last reservation
  if (slotEndMinutes > currentStart) {
    const gapDuration = slotEndMinutes - currentStart;
    if (gapDuration >= minDuration) {
      gaps.push({
        startTime: minutesToTime(currentStart),
        endTime: minutesToTime(currentStart + minDuration),
      });
    }
  }

  return gaps;
}
