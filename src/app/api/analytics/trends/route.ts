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
    const weeks = parseInt(searchParams.get('weeks') || '4');
    const locationId = searchParams.get('locationId');
    const roomId = searchParams.get('roomId');

    // Build room filter
    let roomIds: string[] | undefined;

    if (roomId) {
      roomIds = [roomId];
    } else if (session.user.role === 'STAFF' && session.user.locationId) {
      const rooms = await prisma.room.findMany({
        where: { locationId: session.user.locationId },
        select: { id: true },
      });
      roomIds = rooms.map((r) => r.id);
    } else if (locationId) {
      const rooms = await prisma.room.findMany({
        where: { locationId },
        select: { id: true },
      });
      roomIds = rooms.map((r) => r.id);
    }

    // Get weekly trends
    const weeklyData: {
      weekStart: string;
      weekEnd: string;
      totalReservations: number;
      totalCheckIns: number;
      totalNoShows: number;
      utilizationPercent: number;
    }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);

      const whereClause: Record<string, unknown> = {
        date: {
          gte: new Date(weekStart.toISOString().split('T')[0]),
          lte: new Date(weekEnd.toISOString().split('T')[0]),
        },
      };

      if (roomIds) {
        whereClause.roomId = { in: roomIds };
      }

      const weekAnalytics = await prisma.usageAnalytics.aggregate({
        where: whereClause,
        _sum: {
          reservationCount: true,
          checkInCount: true,
          noShowCount: true,
          utilizationMins: true,
        },
      });

      // Calculate potential minutes for the week
      const roomCount = roomIds
        ? roomIds.length
        : await prisma.room.count({ where: { active: true } });
      const potentialMinutes = roomCount * 7 * 12 * 60; // 7 days, 12 hours/day

      const utilizationMins = weekAnalytics._sum.utilizationMins || 0;

      weeklyData.push({
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        totalReservations: weekAnalytics._sum.reservationCount || 0,
        totalCheckIns: weekAnalytics._sum.checkInCount || 0,
        totalNoShows: weekAnalytics._sum.noShowCount || 0,
        utilizationPercent: potentialMinutes > 0
          ? Math.round((utilizationMins / potentialMinutes) * 100)
          : 0,
      });
    }

    // Calculate week-over-week changes
    const trends = weeklyData.map((week, index) => {
      if (index === 0) {
        return {
          ...week,
          reservationChange: 0,
          checkInChange: 0,
          utilizationChange: 0,
        };
      }

      const prevWeek = weeklyData[index - 1];
      return {
        ...week,
        reservationChange: prevWeek.totalReservations > 0
          ? Math.round(
              ((week.totalReservations - prevWeek.totalReservations) /
                prevWeek.totalReservations) *
                100
            )
          : 0,
        checkInChange: prevWeek.totalCheckIns > 0
          ? Math.round(
              ((week.totalCheckIns - prevWeek.totalCheckIns) / prevWeek.totalCheckIns) *
                100
            )
          : 0,
        utilizationChange: prevWeek.utilizationPercent > 0
          ? week.utilizationPercent - prevWeek.utilizationPercent
          : 0,
      };
    });

    // Get room-level comparison
    const roomComparison = await prisma.room.findMany({
      where: {
        active: true,
        ...(roomIds && { id: { in: roomIds } }),
      },
      select: {
        id: true,
        name: true,
        location: {
          select: { name: true },
        },
      },
    });

    const roomAnalytics = await Promise.all(
      roomComparison.map(async (room) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const analytics = await prisma.usageAnalytics.aggregate({
          where: {
            roomId: room.id,
            date: { gte: thirtyDaysAgo },
          },
          _sum: {
            reservationCount: true,
            checkInCount: true,
            noShowCount: true,
            utilizationMins: true,
          },
        });

        const potentialMinutes = 30 * 12 * 60; // 30 days, 12 hours/day
        const total = analytics._sum.reservationCount || 0;
        const checkIns = analytics._sum.checkInCount || 0;
        const noShows = analytics._sum.noShowCount || 0;

        return {
          roomId: room.id,
          roomName: room.name,
          locationName: room.location.name,
          totalReservations: total,
          checkInRate: total > 0 ? Math.round((checkIns / total) * 100) : 0,
          noShowRate: total > 0 ? Math.round((noShows / total) * 100) : 0,
          utilizationPercent: potentialMinutes > 0
            ? Math.round(((analytics._sum.utilizationMins || 0) / potentialMinutes) * 100)
            : 0,
        };
      })
    );

    return NextResponse.json({
      weeklyTrends: trends,
      roomComparison: roomAnalytics.sort(
        (a, b) => b.utilizationPercent - a.utilizationPercent
      ),
    });
  } catch (error) {
    console.error('Error fetching analytics trends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
