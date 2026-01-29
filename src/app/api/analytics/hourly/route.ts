import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admin/staff
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const locationId = searchParams.get('locationId');
    const roomId = searchParams.get('roomId');

    // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build filters
    const whereClause: Record<string, unknown> = {
      date: {
        gte: new Date(start.toISOString().split('T')[0]),
        lte: new Date(end.toISOString().split('T')[0]),
      },
    };

    if (roomId) {
      whereClause.roomId = roomId;
    }

    // If staff, scope to their location
    if (session.user.role === 'STAFF' && session.user.locationId) {
      const rooms = await prisma.room.findMany({
        where: { locationId: session.user.locationId },
        select: { id: true },
      });
      whereClause.roomId = { in: rooms.map((r) => r.id) };
    } else if (locationId) {
      const rooms = await prisma.room.findMany({
        where: { locationId },
        select: { id: true },
      });
      whereClause.roomId = { in: rooms.map((r) => r.id) };
    }

    // Get hourly breakdown
    const hourlyData = await prisma.usageAnalytics.groupBy({
      by: ['hour'],
      where: whereClause,
      _sum: {
        reservationCount: true,
        checkInCount: true,
        noShowCount: true,
        utilizationMins: true,
      },
      _count: true,
      orderBy: {
        hour: 'asc',
      },
    });

    // Calculate averages and format
    const hourlyBreakdown = hourlyData.map((entry) => {
      const total = entry._sum.reservationCount || 0;
      const checkIns = entry._sum.checkInCount || 0;
      const noShows = entry._sum.noShowCount || 0;
      const utilizationMins = entry._sum.utilizationMins || 0;

      return {
        hour: entry.hour,
        reservationCount: total,
        checkInCount: checkIns,
        noShowCount: noShows,
        checkInRate: total > 0 ? Math.round((checkIns / total) * 100) : 0,
        noShowRate: total > 0 ? Math.round((noShows / total) * 100) : 0,
        avgUtilizationMins: entry._count > 0 ? Math.round(utilizationMins / entry._count) : 0,
      };
    });

    // Fill in missing hours (8 AM to 9 PM)
    const fullHourlyBreakdown = [];
    for (let hour = 8; hour <= 21; hour++) {
      const existing = hourlyBreakdown.find((h) => h.hour === hour);
      if (existing) {
        fullHourlyBreakdown.push(existing);
      } else {
        fullHourlyBreakdown.push({
          hour,
          reservationCount: 0,
          checkInCount: 0,
          noShowCount: 0,
          checkInRate: 0,
          noShowRate: 0,
          avgUtilizationMins: 0,
        });
      }
    }

    // Generate heatmap data (day of week x hour)
    const heatmapData = await prisma.usageAnalytics.groupBy({
      by: ['dayOfWeek', 'hour'],
      where: whereClause,
      _sum: {
        reservationCount: true,
      },
      _count: true,
    });

    const heatmap = heatmapData.map((entry) => ({
      dayOfWeek: entry.dayOfWeek,
      hour: entry.hour,
      value: entry._count > 0
        ? Math.round((entry._sum.reservationCount || 0) / entry._count)
        : 0,
    }));

    return NextResponse.json({
      hourlyBreakdown: fullHourlyBreakdown,
      heatmap,
      peakHours: fullHourlyBreakdown
        .sort((a, b) => b.reservationCount - a.reservationCount)
        .slice(0, 3)
        .map((h) => ({ hour: h.hour, reservations: h.reservationCount })),
    });
  } catch (error) {
    console.error('Error fetching hourly analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
