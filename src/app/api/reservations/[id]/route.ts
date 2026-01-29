import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendReservationApproval, sendReservationDecline } from '@/lib/email';
import { apiRateLimiter } from '@/lib/rate-limit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = apiRateLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        room: true,
        location: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (session.user.role === 'STAFF') {
      if (reservation.locationId !== session.user.locationId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const updateData: Record<string, unknown> = {};
    
    if (status === 'APPROVED') {
      updateData.status = 'APPROVED';
      updateData.approvedAt = new Date();
    } else if (status === 'DECLINED') {
      updateData.status = 'DECLINED';
      updateData.declinedAt = new Date();
    } else if (status === 'CANCELLED') {
      updateData.status = 'CANCELLED';
      updateData.cancelledAt = new Date();
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        room: true,
        location: true,
        programType: true,
      },
    });

    // Send email notifications (don't fail the update if email fails)
    try {
      if (status === 'APPROVED') {
        await sendReservationApproval(
          reservation.requesterEmail,
          updatedReservation
        );
      } else if (status === 'DECLINED') {
        await sendReservationDecline(
          reservation.requesterEmail,
          updatedReservation
        );
      }
    } catch (emailError) {
      console.error('Failed to send status notification email:', emailError);
      // Continue - status update was successful
    }

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = apiRateLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (session.user.role === 'STAFF') {
      if (reservation.locationId !== session.user.locationId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await prisma.reservation.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Reservation deleted' });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}