import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role === 'PATRON') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Prisma.ReservationWhereInput = {};

    // Staff can only see their location's data
    if (session.user.role === 'STAFF' && session.user.locationId) {
      where.locationId = session.user.locationId;
    }

    if (startDate || endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.date = dateFilter;
    }

    switch (reportType) {
      case 'summary':
        // Overall summary statistics
        const [
          totalReservations,
          pendingReservations,
          approvedReservations,
          declinedReservations,
          cancelledReservations,
          activeRooms,
          activeLocations,
        ] = await Promise.all([
          prisma.reservation.count({ where }),
          prisma.reservation.count({ where: { ...where, status: 'PENDING' } }),
          prisma.reservation.count({ where: { ...where, status: 'APPROVED' } }),
          prisma.reservation.count({ where: { ...where, status: 'DECLINED' } }),
          prisma.reservation.count({ where: { ...where, status: 'CANCELLED' } }),
          prisma.room.count({ 
            where: { 
              active: true,
              ...(session.user.role === 'STAFF' && session.user.locationId 
                ? { locationId: session.user.locationId } 
                : {})
            } 
          }),
          prisma.location.count({ where: { active: true } }),
        ]);

        return NextResponse.json({
          totalReservations,
          pendingReservations,
          approvedReservations,
          declinedReservations,
          cancelledReservations,
          activeRooms,
          activeLocations,
        });

      case 'by-location':
        // Reservations grouped by location
        const byLocation = await prisma.reservation.groupBy({
          by: ['locationId', 'status'],
          where,
          _count: {
            id: true,
          },
        });

        const locations = await prisma.location.findMany({
          where: session.user.role === 'STAFF' && session.user.locationId
            ? { id: session.user.locationId }
            : {},
          select: {
            id: true,
            name: true,
          },
        });

        const locationReport = locations.map((location) => {
          const locationData = byLocation.filter((r) => r.locationId === location.id);
          return {
            location: location.name,
            total: locationData.reduce((sum, r) => sum + r._count.id, 0),
            pending: locationData.find((r) => r.status === 'PENDING')?._count.id || 0,
            approved: locationData.find((r) => r.status === 'APPROVED')?._count.id || 0,
            declined: locationData.find((r) => r.status === 'DECLINED')?._count.id || 0,
            cancelled: locationData.find((r) => r.status === 'CANCELLED')?._count.id || 0,
          };
        });

        return NextResponse.json(locationReport);

      case 'by-program-type':
        // Reservations grouped by program type
        const byProgramType = await prisma.reservation.groupBy({
          by: ['programTypeId', 'status'],
          where,
          _count: {
            id: true,
          },
        });

        const programTypes = await prisma.programType.findMany({
          select: {
            id: true,
            name: true,
          },
        });

        const programTypeReport = programTypes.map((programType) => {
          const programData = byProgramType.filter((r) => r.programTypeId === programType.id);
          return {
            programType: programType.name,
            total: programData.reduce((sum, r) => sum + r._count.id, 0),
            pending: programData.find((r) => r.status === 'PENDING')?._count.id || 0,
            approved: programData.find((r) => r.status === 'APPROVED')?._count.id || 0,
            declined: programData.find((r) => r.status === 'DECLINED')?._count.id || 0,
            cancelled: programData.find((r) => r.status === 'CANCELLED')?._count.id || 0,
          };
        });

        return NextResponse.json(programTypeReport);

      case 'availability':
        // Room availability report
        const rooms = await prisma.room.findMany({
          where: {
            active: true,
            ...(session.user.role === 'STAFF' && session.user.locationId
              ? { locationId: session.user.locationId }
              : {}),
          },
          include: {
            location: true,
            roomType: true,
            reservations: {
              where: {
                date: {
                  gte: new Date(),
                },
                status: {
                  in: ['PENDING', 'APPROVED'],
                },
              },
            },
          },
        });

        const availabilityReport = rooms.map((room) => ({
          roomName: room.name,
          location: room.location.name,
          roomType: room.roomType.name,
          capacity: room.capacity,
          upcomingReservations: room.reservations.length,
          available: room.active,
        }));

        return NextResponse.json(availabilityReport);

      case 'export':
        // Detailed export for CSV
        const exportData = await prisma.reservation.findMany({
          where,
          include: {
            room: true,
            location: true,
            programType: true,
            createdBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        });

        const csvData = exportData.map((reservation) => ({
          id: reservation.id,
          date: reservation.date.toISOString().split('T')[0],
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          room: reservation.room.name,
          location: reservation.location.name,
          programType: reservation.programType.name,
          status: reservation.status,
          requesterName: reservation.requesterName,
          requesterEmail: reservation.requesterEmail,
          requesterPhone: reservation.requesterPhone,
          libraryCardId: reservation.libraryCardId || '',
          organizationName: reservation.organizationName || '',
          createdBy: reservation.createdBy.name,
          createdAt: reservation.createdAt.toISOString(),
        }));

        return NextResponse.json(csvData);

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}