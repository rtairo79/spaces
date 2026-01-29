import { NextRequest, NextResponse } from 'next/server';
import { suggestAlternativeRooms } from '@/lib/suggestion-engine';
import { z } from 'zod';

const requestSchema = z.object({
  locationId: z.string(),
  preferredDate: z.string().optional(),
  preferredStartTime: z.string().optional(),
  preferredDayOfWeek: z.number().min(0).max(6).optional(),
  duration: z.number().min(15).max(480).default(60),
  requiredCapacity: z.number().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params = requestSchema.parse(body);

    const suggestions = await suggestAlternativeRooms(params.locationId, {
      preferredDate: params.preferredDate,
      preferredStartTime: params.preferredStartTime,
      preferredDayOfWeek: params.preferredDayOfWeek,
      duration: params.duration,
      requiredCapacity: params.requiredCapacity,
    });

    return NextResponse.json({
      suggestions,
      totalFound: suggestions.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    console.error('Error generating room suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
