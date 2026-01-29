import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Vercel cron authentication
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if configured
    if (CRON_SECRET) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get yesterday's date for aggregation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    // Get all reservations from yesterday
    const reservations = await prisma.reservation.findMany({
      where: {
        date,
        status: {
          in: ['APPROVED', 'PENDING'],
        },
      },
      include: {
        room: true,
      },
    });

    // Group by room and hour
    const analytics: Map<string, {
      roomId: string;
      hour: number;
      reservationCount: number;
      checkInCount: number;
      noShowCount: number;
      walkInCount: number;
      utilizationMins: number;
    }> = new Map();

    for (const reservation of reservations) {
      const [startHour] = reservation.startTime.split(':').map(Number);
      const [endHour, endMin] = reservation.endTime.split(':').map(Number);
      const [startH, startM] = reservation.startTime.split(':').map(Number);

      // Calculate duration in minutes
      const durationMins = (endHour * 60 + endMin) - (startH * 60 + startM);

      // Create entries for each hour the reservation spans
      for (let hour = startHour; hour <= endHour; hour++) {
        const key = `${reservation.roomId}-${hour}`;

        if (!analytics.has(key)) {
          analytics.set(key, {
            roomId: reservation.roomId,
            hour,
            reservationCount: 0,
            checkInCount: 0,
            noShowCount: 0,
            walkInCount: 0,
            utilizationMins: 0,
          });
        }

        const entry = analytics.get(key)!;
        entry.reservationCount++;

        // Count based on check-in status
        if (reservation.checkInStatus === 'CHECKED_IN') {
          entry.checkInCount++;
        } else if (
          reservation.checkInStatus === 'NO_SHOW' ||
          reservation.checkInStatus === 'AUTO_RELEASED'
        ) {
          entry.noShowCount++;
        }

        if (reservation.isWalkIn) {
          entry.walkInCount++;
        }

        // Calculate utilization minutes for this hour
        if (hour === startHour && hour === endHour) {
          entry.utilizationMins += durationMins;
        } else if (hour === startHour) {
          entry.utilizationMins += 60 - startM;
        } else if (hour === endHour) {
          entry.utilizationMins += endMin;
        } else {
          entry.utilizationMins += 60;
        }
      }
    }

    // Upsert analytics records
    let created = 0;
    let updated = 0;

    for (const entry of analytics.values()) {
      const existing = await prisma.usageAnalytics.findUnique({
        where: {
          roomId_date_hour: {
            roomId: entry.roomId,
            date,
            hour: entry.hour,
          },
        },
      });

      if (existing) {
        await prisma.usageAnalytics.update({
          where: { id: existing.id },
          data: {
            reservationCount: entry.reservationCount,
            checkInCount: entry.checkInCount,
            noShowCount: entry.noShowCount,
            walkInCount: entry.walkInCount,
            utilizationMins: entry.utilizationMins,
          },
        });
        updated++;
      } else {
        await prisma.usageAnalytics.create({
          data: {
            roomId: entry.roomId,
            date,
            hour: entry.hour,
            dayOfWeek,
            reservationCount: entry.reservationCount,
            checkInCount: entry.checkInCount,
            noShowCount: entry.noShowCount,
            walkInCount: entry.walkInCount,
            utilizationMins: entry.utilizationMins,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Aggregated analytics for ${dateStr}`,
      date: dateStr,
      created,
      updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error aggregating analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to aggregate analytics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
