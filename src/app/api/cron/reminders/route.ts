import { NextRequest, NextResponse } from 'next/server';
import { processReminders } from '@/lib/reminder-sender';

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

    const result = await processReminders();

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} reservations, sent ${result.sent.length} reminders`,
      sent: result.sent,
      errors: result.errors.length > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process reminders',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
