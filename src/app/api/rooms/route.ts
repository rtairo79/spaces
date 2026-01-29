import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const createRoomSchema = z.object({
  name: z.string().min(1),
  locationId: z.string(),
  roomTypeId: z.string(),
  capacity: z.number().positive(),
  description: z.string().optional(),
  active: z.boolean().default(true),
  timeSlots: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    })
  ),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const activeOnly = searchParams.get('active') === 'true';

    const where: Prisma.RoomWhereInput = {};
    if (locationId) where.locationId = locationId;
    if (activeOnly) where.active = true;

    const rooms = await prisma.room.findMany({
      where,
      include: {
        location: true,
        roomType: true,
        timeSlots: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
        _count: {
          select: {
            reservations: {
              where: {
                status: {
                  in: ['PENDING', 'APPROVED'],
                },
                date: {
                  gte: new Date(),
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validatedData = createRoomSchema.parse(body);

    const { timeSlots, ...roomData } = validatedData;

    const room = await prisma.room.create({
      data: {
        ...roomData,
        timeSlots: {
          create: timeSlots,
        },
      },
      include: {
        location: true,
        roomType: true,
        timeSlots: true,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}