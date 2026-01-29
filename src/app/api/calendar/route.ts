import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const roomId = searchParams.get('roomId');
    const locationId = searchParams.get('locationId');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Build query filters
    const where: Record<string, unknown> = {
      date: {
        gte: start,
        lte: end,
      },
      status: {
        in: ['PENDING', 'APPROVED'],
      },
      checkInStatus: {
        notIn: ['AUTO_RELEASED', 'NO_SHOW'],
      },
    };

    if (roomId) {
      where.roomId = roomId;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    // Fetch reservations
    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        room: {
          include: {
            location: true,
            roomType: true,
          },
        },
        location: true,
        programType: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    // Fetch rooms for time slots
    const roomsQuery: Record<string, unknown> = {
      active: true,
      availabilityStatus: 'AVAILABLE',
    };

    if (roomId) {
      roomsQuery.id = roomId;
    }

    if (locationId) {
      roomsQuery.locationId = locationId;
    }

    const rooms = await prisma.room.findMany({
      where: roomsQuery,
      include: {
        timeSlots: true,
        location: true,
      },
    });

    // Build calendar data structure
    const calendarData: Record<string, {
      date: string;
      dayOfWeek: number;
      rooms: Record<string, {
        roomId: string;
        roomName: string;
        locationName: string;
        slots: Array<{
          startTime: string;
          endTime: string;
          status: 'available' | 'booked' | 'yours' | 'unavailable';
          reservation?: {
            id: string;
            requesterName: string;
            programType: string;
            status: string;
            checkInStatus: string;
          };
        }>;
      }>;
    }> = {};

    // Initialize calendar structure for each day
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      calendarData[dateStr] = {
        date: dateStr,
        dayOfWeek,
        rooms: {},
      };

      // Add rooms and their time slots
      for (const room of rooms) {
        const daySlots = room.timeSlots.filter((ts) => ts.dayOfWeek === dayOfWeek);
        const slots: Array<{
          startTime: string;
          endTime: string;
          status: 'available' | 'booked' | 'yours' | 'unavailable';
          reservation?: {
            id: string;
            requesterName: string;
            programType: string;
            status: string;
            checkInStatus: string;
          };
        }> = [];

        // Generate hourly slots within operating hours
        for (const daySlot of daySlots) {
          const startMinutes = timeToMinutes(daySlot.startTime);
          const endMinutes = timeToMinutes(daySlot.endTime);

          for (let mins = startMinutes; mins < endMinutes; mins += 60) {
            const slotStart = minutesToTime(mins);
            const slotEnd = minutesToTime(Math.min(mins + 60, endMinutes));

            // Check if this slot is booked
            const reservation = reservations.find(
              (r) =>
                r.roomId === room.id &&
                r.date.toISOString().split('T')[0] === dateStr &&
                timeToMinutes(r.startTime) <= mins &&
                timeToMinutes(r.endTime) > mins
            );

            if (reservation) {
              const isYours = session?.user?.id === reservation.createdById;
              slots.push({
                startTime: slotStart,
                endTime: slotEnd,
                status: isYours ? 'yours' : 'booked',
                reservation: {
                  id: reservation.id,
                  requesterName: reservation.requesterName,
                  programType: reservation.programType.name,
                  status: reservation.status,
                  checkInStatus: reservation.checkInStatus,
                },
              });
            } else {
              slots.push({
                startTime: slotStart,
                endTime: slotEnd,
                status: 'available',
              });
            }
          }
        }

        if (slots.length > 0) {
          calendarData[dateStr].rooms[room.id] = {
            roomId: room.id,
            roomName: room.name,
            locationName: room.location.name,
            slots,
          };
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      startDate,
      endDate,
      days: Object.values(calendarData),
      rooms: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        locationName: r.location.name,
      })),
    });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
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
