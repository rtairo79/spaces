import { prisma } from '@/lib/prisma';
import { sendReservationReminder } from '@/lib/email';

interface ReminderResult {
  processed: number;
  sent: { reservationId: string; type: '24h' | '1h' }[];
  errors: string[];
}

export async function processReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    processed: 0,
    sent: [],
    errors: [],
  };

  const now = new Date();

  try {
    // Get all upcoming approved reservations
    const reservations = await prisma.reservation.findMany({
      where: {
        status: 'APPROVED',
        checkInStatus: 'NOT_CHECKED_IN',
        date: {
          gte: new Date(now.toISOString().split('T')[0]), // Today or future
          lte: new Date(new Date().setDate(now.getDate() + 1)), // Within next 24 hours
        },
      },
      include: {
        room: {
          include: {
            location: true,
          },
        },
        location: true,
        programType: true,
        reminderLogs: true,
      },
    });

    for (const reservation of reservations) {
      try {
        // Calculate reservation start datetime
        const [startHour, startMin] = reservation.startTime.split(':').map(Number);
        const reservationStart = new Date(reservation.date);
        reservationStart.setHours(startHour, startMin, 0, 0);

        const hoursUntilStart = (reservationStart.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Check if 24h reminder should be sent
        const has24hReminder = reservation.reminderLogs.some((log) => log.reminderType === '24h');
        if (!has24hReminder && hoursUntilStart <= 24 && hoursUntilStart > 1) {
          await sendReminderAndLog(reservation, '24h', result);
        }

        // Check if 1h reminder should be sent
        const has1hReminder = reservation.reminderLogs.some((log) => log.reminderType === '1h');
        if (!has1hReminder && hoursUntilStart <= 1 && hoursUntilStart > 0) {
          await sendReminderAndLog(reservation, '1h', result);
        }

        result.processed++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push(`Failed to process reservation ${reservation.id}: ${errorMessage}`);
      }
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Database query failed: ${errorMessage}`);
    return result;
  }
}

async function sendReminderAndLog(
  reservation: {
    id: string;
    requesterEmail: string;
    room: { name: string; location: { name: string } };
    location: { name: string };
    programType: { name: string };
    date: Date;
    startTime: string;
    endTime: string;
  },
  reminderType: '24h' | '1h',
  result: ReminderResult
) {
  try {
    // Send reminder email
    await sendReservationReminder(
      reservation.requesterEmail,
      {
        room: { name: reservation.room.name },
        location: { name: reservation.location.name },
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
      },
      reminderType
    );

    // Log the reminder
    await prisma.reminderLog.create({
      data: {
        reservationId: reservation.id,
        reminderType,
        status: 'SENT',
      },
    });

    result.sent.push({ reservationId: reservation.id, type: reminderType });
  } catch (err) {
    // Log failed reminder
    await prisma.reminderLog.create({
      data: {
        reservationId: reservation.id,
        reminderType,
        status: 'FAILED',
      },
    });

    throw err;
  }
}
