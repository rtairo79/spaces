import { prisma } from '@/lib/prisma';

interface TimePreference {
  preferredDate?: string;
  preferredStartTime?: string;
  preferredDayOfWeek?: number;
  duration: number; // minutes
}

interface SuggestedSlot {
  date: string;
  startTime: string;
  endTime: string;
  score: number;
  reason: string;
}

interface SuggestedRoom {
  roomId: string;
  roomName: string;
  locationName: string;
  score: number;
  availableSlots: SuggestedSlot[];
}

export async function suggestAlternativeTimes(
  roomId: string,
  preference: TimePreference
): Promise<SuggestedSlot[]> {
  const suggestions: SuggestedSlot[] = [];

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { timeSlots: true },
  });

  if (!room) return suggestions;

  // Get historical utilization for this room
  const utilizationData = await prisma.usageAnalytics.groupBy({
    by: ['dayOfWeek', 'hour'],
    where: { roomId },
    _avg: { reservationCount: true },
  });

  const utilizationMap = new Map<string, number>();
  utilizationData.forEach((d) => {
    utilizationMap.set(`${d.dayOfWeek}-${d.hour}`, d._avg.reservationCount || 0);
  });

  const maxUtilization = Math.max(...Array.from(utilizationMap.values()), 1);

  // Generate suggestions for the next 7 days
  const today = new Date();
  const preferredMinutes = preference.preferredStartTime
    ? timeToMinutes(preference.preferredStartTime)
    : 9 * 60; // Default 9 AM

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    // Get time slots for this day
    const daySlots = room.timeSlots.filter((ts) => ts.dayOfWeek === dayOfWeek);

    for (const slot of daySlots) {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);

      // Check available times within this slot
      const reservations = await prisma.reservation.findMany({
        where: {
          roomId,
          date,
          status: { in: ['PENDING', 'APPROVED'] },
          checkInStatus: { notIn: ['AUTO_RELEASED', 'NO_SHOW'] },
        },
        orderBy: { startTime: 'asc' },
      });

      // Find gaps
      let currentStart = slotStart;
      const gaps: { start: number; end: number }[] = [];

      for (const res of reservations) {
        const resStart = timeToMinutes(res.startTime);
        const resEnd = timeToMinutes(res.endTime);

        if (resStart > currentStart) {
          gaps.push({ start: currentStart, end: resStart });
        }
        currentStart = Math.max(currentStart, resEnd);
      }

      if (currentStart < slotEnd) {
        gaps.push({ start: currentStart, end: slotEnd });
      }

      // Score each gap
      for (const gap of gaps) {
        if (gap.end - gap.start < preference.duration) continue;

        const suggestedStart = gap.start;
        const suggestedEnd = Math.min(gap.start + preference.duration, gap.end);

        // Calculate score
        let score = 100;

        // Penalty for time difference from preferred
        const hourDiff = Math.abs(suggestedStart - preferredMinutes) / 60;
        score -= hourDiff * 5;

        // Bonus for matching preferred day
        if (preference.preferredDayOfWeek !== undefined && dayOfWeek === preference.preferredDayOfWeek) {
          score += 10;
        }

        // Bonus for low utilization (less busy times)
        const hourKey = `${dayOfWeek}-${Math.floor(suggestedStart / 60)}`;
        const utilization = utilizationMap.get(hourKey) || 0;
        const utilizationBonus = (1 - utilization / maxUtilization) * 30;
        score += utilizationBonus;

        // Penalty for days further in future
        score -= dayOffset * 2;

        // Generate reason
        let reason = '';
        if (dayOffset === 0) {
          reason = 'Today';
        } else if (dayOffset === 1) {
          reason = 'Tomorrow';
        } else {
          reason = date.toLocaleDateString('en-US', { weekday: 'long' });
        }

        if (utilization < maxUtilization * 0.3) {
          reason += ' (Low demand)';
        } else if (hourDiff < 1) {
          reason += ' (Near preferred time)';
        }

        suggestions.push({
          date: dateStr,
          startTime: minutesToTime(suggestedStart),
          endTime: minutesToTime(suggestedEnd),
          score: Math.max(0, Math.round(score)),
          reason,
        });
      }
    }
  }

  // Sort by score and return top results
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export async function suggestAlternativeRooms(
  locationId: string,
  preference: TimePreference & { requiredCapacity?: number }
): Promise<SuggestedRoom[]> {
  const suggestions: SuggestedRoom[] = [];

  // Get all available rooms at this location
  const rooms = await prisma.room.findMany({
    where: {
      locationId,
      active: true,
      availabilityStatus: 'AVAILABLE',
      ...(preference.requiredCapacity && { capacity: { gte: preference.requiredCapacity } }),
    },
    include: {
      timeSlots: true,
      location: true,
    },
  });

  for (const room of rooms) {
    const availableSlots = await suggestAlternativeTimes(room.id, preference);

    if (availableSlots.length === 0) continue;

    // Calculate room score based on available slots
    const bestSlotScore = Math.max(...availableSlots.map((s) => s.score));

    suggestions.push({
      roomId: room.id,
      roomName: room.name,
      locationName: room.location.name,
      score: bestSlotScore,
      availableSlots: availableSlots.slice(0, 3), // Top 3 slots per room
    });
  }

  return suggestions.sort((a, b) => b.score - a.score);
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
