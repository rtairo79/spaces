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

    // Aggregate analytics
    const analytics = await prisma.usageAnalytics.aggregate({
      where: whereClause,
      _sum: {
        reservationCount: true,
        checkInCount: true,
        noShowCount: true,
        walkInCount: true,
        utilizationMins: true,
      },
    });

    // Get room count and calculate potential hours
    const roomCount = await prisma.room.count({
      where: {
        active: true,
        ...(roomId && { id: roomId }),
        ...(locationId && { locationId }),
        ...(session.user.role === 'STAFF' &&
          session.user.locationId && { locationId: session.user.locationId }),
      },
    });

    // Calculate days in range
    const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Assuming 12 hours of operation per day per room
    const potentialMinutes = roomCount * daysInRange * 12 * 60;

    const totalReservations = analytics._sum.reservationCount || 0;
    const totalCheckIns = analytics._sum.checkInCount || 0;
    const totalNoShows = analytics._sum.noShowCount || 0;
    const totalWalkIns = analytics._sum.walkInCount || 0;
    const totalUtilizationMins = analytics._sum.utilizationMins || 0;

    // Calculate rates
    const checkInRate = totalReservations > 0
      ? Math.round((totalCheckIns / totalReservations) * 100)
      : 0;
    const noShowRate = totalReservations > 0
      ? Math.round((totalNoShows / totalReservations) * 100)
      : 0;
    const utilizationPercent = potentialMinutes > 0
      ? Math.round((totalUtilizationMins / potentialMinutes) * 100)
      : 0;

    return NextResponse.json({
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        daysInRange,
      },
      summary: {
        totalReservations,
        totalCheckIns,
        totalNoShows,
        totalWalkIns,
        checkInRate,
        noShowRate,
        utilizationPercent,
      },
      metadata: {
        roomCount,
        potentialMinutes,
        actualMinutes: totalUtilizationMins,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
