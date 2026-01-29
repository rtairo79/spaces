import { prisma } from '@/lib/prisma';
import { sendRoomReleasedNotification } from '@/lib/email';

interface ProcessingResult {
  processed: number;
  released: string[];
  errors: string[];
}

export async function processNoShows(): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    processed: 0,
    released: [],
    errors: [],
  };

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  try {
    // Find all approved reservations for today that haven't been checked in
    const reservations = await prisma.reservation.findMany({
      where: {
        date: new Date(today),
        status: 'APPROVED',
        checkInStatus: 'NOT_CHECKED_IN',
      },
      include: {
        room: {
          include: {
            bookingRule: true,
            location: true,
          },
        },
        location: true,
        programType: true,
      },
    });

    for (const reservation of reservations) {
      try {
        const [startHour, startMin] = reservation.startTime.split(':').map(Number);
        const reservationStartMinutes = startHour * 60 + startMin;

        // Get grace period (default 15 minutes)
        const gracePeriod = reservation.room.bookingRule?.gracePeriodMinutes ?? 15;

        // Check if grace period has passed
        const graceEndMinutes = reservationStartMinutes + gracePeriod;

        if (currentMinutes > graceEndMinutes) {
          // Mark as auto-released
          await prisma.reservation.update({
            where: { id: reservation.id },
            data: {
              checkInStatus: 'AUTO_RELEASED',
              releasedAt: now,
            },
          });

          // Send notification email (non-blocking)
          sendRoomReleasedNotification(reservation.requesterEmail, {
            ...reservation,
            room: reservation.room,
            location: reservation.location,
            programType: reservation.programType,
          }).catch((err) => {
            console.error(`Failed to send release notification for ${reservation.id}:`, err);
          });

          result.released.push(reservation.id);
          result.processed++;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push(`Failed to process ${reservation.id}: ${errorMessage}`);
      }
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Database query failed: ${errorMessage}`);
    return result;
  }
}

export async function getReleasedSlots(locationId?: string) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find recently released slots that still have time remaining
  const releasedReservations = await prisma.reservation.findMany({
    where: {
      date: new Date(today),
      checkInStatus: 'AUTO_RELEASED',
      ...(locationId && { locationId }),
    },
    include: {
      room: {
        include: {
          location: true,
        },
      },
      location: true,
    },
  });

  // Filter to only include slots that still have time left
  return releasedReservations.filter((res) => {
    const [endHour, endMin] = res.endTime.split(':').map(Number);
    const endMinutes = endHour * 60 + endMin;
    return currentMinutes < endMinutes - 15; // At least 15 minutes remaining
  });
}
