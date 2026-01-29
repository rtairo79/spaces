import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyPredictions, getStoredPredictions } from '@/lib/prediction-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId') || undefined;
    const roomId = searchParams.get('roomId') || undefined;
    const refresh = searchParams.get('refresh') === 'true';

    // Try to get stored predictions first (unless refresh requested)
    if (!refresh && !locationId && !roomId) {
      const stored = await getStoredPredictions();
      if (stored) {
        return NextResponse.json({
          ...stored,
          source: 'cached',
        });
      }
    }

    // Generate fresh predictions
    const forecast = await generateWeeklyPredictions(locationId, roomId);

    return NextResponse.json({
      ...forecast,
      source: 'generated',
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
