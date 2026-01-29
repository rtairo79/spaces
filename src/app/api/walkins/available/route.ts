import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const dayOfWeek = now.getDay();

    // Get all active rooms
    const rooms = await prisma.room.findMany({
      where: {
        active: true,
        availabilityStatus: 'AVAILABLE',
        ...(locationId && { locationId }),
      },
      include: {
        location: true,
        timeSlots: true,
        bookingRule: true,
      },
    });

    const availableRooms: Array<{
      room: {
        id: string;
        name: string;
        capacity: number;
        location: { id: string; name: string };
      };
      availableUntil: string;
      wasReleased: boolean;
      originalReservationId?: string;
    }> = [];

    for (const room of rooms) {
      // Check if room is open now
      const todaySlots = room.timeSlots.filter((ts) => ts.dayOfWeek === dayOfWeek);
      const currentSlot = todaySlots.find((ts) => {
        const startMins = timeToMinutes(ts.startTime);
        const endMins = timeToMinutes(ts.endTime);
        return currentMinutes >= startMins && currentMinutes < endMins;
      });

      if (!currentSlot) continue;

      // Get all reservations for today
      const reservations = await prisma.reservation.findMany({
        where: {
          roomId: room.id,
          date: new Date(today),
          status: { in: ['PENDING', 'APPROVED'] },
        },
        orderBy: { startTime: 'asc' },
      });

      // Find current time slot availability
      let availableUntil = currentSlot.endTime;
      let wasReleased = false;
      let originalReservationId: string | undefined;

      // Check if there's a released reservation for the current time
      const releasedRes = reservations.find((res) => {
        if (res.checkInStatus !== 'AUTO_RELEASED') return false;
        const startMins = timeToMinutes(res.startTime);
        const endMins = timeToMinutes(res.endTime);
        return currentMinutes >= startMins && currentMinutes < endMins;
      });

      if (releasedRes) {
        wasReleased = true;
        originalReservationId = releasedRes.id;
        availableUntil = releasedRes.endTime;
      }

      // Check for upcoming reservations that might limit availability
      for (const res of reservations) {
        if (res.checkInStatus === 'AUTO_RELEASED' || res.checkInStatus === 'NO_SHOW') {
          continue; // Skip released reservations
        }

        const startMins = timeToMinutes(res.startTime);
        const endMins = timeToMinutes(res.endTime);

        // Check if reservation is currently active (and not released)
        if (currentMinutes >= startMins && currentMinutes < endMins) {
          // Room is currently booked
          availableUntil = '';
          break;
        }

        // Check if reservation starts soon
        if (startMins > currentMinutes && startMins < timeToMinutes(availableUntil)) {
          availableUntil = res.startTime;
        }
      }

      if (!availableUntil) continue;

      // Only show if at least 15 minutes available
      const availableMinutes = timeToMinutes(availableUntil) - currentMinutes;
      if (availableMinutes < 15) continue;

      availableRooms.push({
        room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          location: {
            id: room.location.id,
            name: room.location.name,
          },
        },
        availableUntil,
        wasReleased,
        originalReservationId,
      });
    }

    // Sort by available duration (longest first)
    availableRooms.sort((a, b) => {
      const aMinutes = timeToMinutes(a.availableUntil) - currentMinutes;
      const bMinutes = timeToMinutes(b.availableUntil) - currentMinutes;
      return bMinutes - aMinutes;
    });

    return NextResponse.json({
      rooms: availableRooms,
      currentTime: minutesToTime(currentMinutes),
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
