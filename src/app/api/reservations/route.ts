import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendReservationConfirmation } from '@/lib/email';
import { Prisma } from '@prisma/client';
import { apiRateLimiter, createRateLimiter } from '@/lib/rate-limit';

const createReservationSchema = z.object({
  roomId: z.string(),
  locationId: z.string(),
  programTypeId: z.string(),
  date: z.string(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  requesterName: z.string().min(1),
  requesterEmail: z.string().email(),
  requesterPhone: z.string().min(1),
  libraryCardId: z.string().optional(),
  organizationName: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');
  const roomId = searchParams.get('roomId');
  const status = searchParams.get('status');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const where: Prisma.ReservationWhereInput = {};

  // Staff can only see their location's reservations
  if (session.user.role === 'STAFF' && session.user.locationId) {
    where.locationId = session.user.locationId;
  }

  if (locationId) where.locationId = locationId;
  if (roomId) where.roomId = roomId;
  if (status) where.status = status as Prisma.EnumReservationStatusFilter;

  if (dateFrom || dateTo) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    where.date = dateFilter;
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      room: true,
      location: true,
      programType: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  return NextResponse.json(reservations);
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = createRateLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createReservationSchema.parse(body);

    // Check for conflicts
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        roomId: validatedData.roomId,
        date: new Date(validatedData.date),
        status: {
          in: ['PENDING', 'APPROVED'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: validatedData.startTime } },
              { endTime: { gt: validatedData.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: validatedData.endTime } },
              { endTime: { gte: validatedData.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: validatedData.startTime } },
              { endTime: { lte: validatedData.endTime } },
            ],
          },
        ],
      },
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: 'Room is already booked for this time slot' },
        { status: 400 }
      );
    }

    // Admin reservations are auto-approved
    const status = session.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING';

    const reservation = await prisma.reservation.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
        status,
        createdById: session.user.id,
        approvedAt: status === 'APPROVED' ? new Date() : null,
      },
      include: {
        room: true,
        location: true,
        programType: true,
      },
    });

    // Send confirmation email (don't fail the reservation if email fails)
    try {
      await sendReservationConfirmation(
        validatedData.requesterEmail,
        reservation
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Continue - reservation was created successfully
    }

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}