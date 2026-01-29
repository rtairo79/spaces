import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyPredictions, storePredictions } from '@/lib/prediction-engine';

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

    // Generate predictions for the upcoming week
    const forecast = await generateWeeklyPredictions();

    // Store predictions
    await storePredictions(forecast);

    return NextResponse.json({
      success: true,
      message: `Predictions updated for week starting ${forecast.weekStartDate}`,
      weekStartDate: forecast.weekStartDate,
      predictionsCount: forecast.predictions.length,
      peakHoursCount: forecast.peakHours.length,
      lowDemandHoursCount: forecast.lowDemandHours.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating predictions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update predictions',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
