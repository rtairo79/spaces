import { prisma } from '@/lib/prisma';

interface HourlyPrediction {
  hour: number;
  dayOfWeek: number;
  predictedUtilization: number;
  confidence: number;
}

interface WeeklyForecast {
  weekStartDate: string;
  predictions: HourlyPrediction[];
  peakHours: { dayOfWeek: number; hour: number; utilization: number }[];
  lowDemandHours: { dayOfWeek: number; hour: number; utilization: number }[];
}

// Weights for weighted moving average (most recent = highest weight)
const WEEK_WEIGHTS = [0.4, 0.3, 0.2, 0.1];

export async function generateWeeklyPredictions(
  locationId?: string,
  roomId?: string
): Promise<WeeklyForecast> {
  // Build room filter
  let roomIds: string[] | undefined;

  if (roomId) {
    roomIds = [roomId];
  } else if (locationId) {
    const rooms = await prisma.room.findMany({
      where: { locationId, active: true },
      select: { id: true },
    });
    roomIds = rooms.map((r) => r.id);
  }

  // Get historical data for the last 4 weeks
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const analytics = await prisma.usageAnalytics.findMany({
    where: {
      date: { gte: fourWeeksAgo },
      ...(roomIds && { roomId: { in: roomIds } }),
    },
  });

  // Group data by week, day, and hour
  const weeklyData: Map<number, Map<string, number[]>> = new Map();

  const now = new Date();
  for (const record of analytics) {
    const recordDate = new Date(record.date);
    const weeksAgo = Math.floor(
      (now.getTime() - recordDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    if (weeksAgo >= 4) continue;

    if (!weeklyData.has(weeksAgo)) {
      weeklyData.set(weeksAgo, new Map());
    }

    const key = `${record.dayOfWeek}-${record.hour}`;
    const weekMap = weeklyData.get(weeksAgo)!;

    if (!weekMap.has(key)) {
      weekMap.set(key, []);
    }

    // Calculate utilization as percentage (assuming 60 min slots)
    const utilization = Math.min(100, Math.round((record.utilizationMins / 60) * 100));
    weekMap.get(key)!.push(utilization);
  }

  // Generate predictions using weighted moving average
  const predictions: HourlyPrediction[] = [];

  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    for (let hour = 8; hour <= 21; hour++) {
      const key = `${dayOfWeek}-${hour}`;

      // Collect values from each week with weights
      let weightedSum = 0;
      let totalWeight = 0;
      const values: number[] = [];

      for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
        const weekMap = weeklyData.get(weekIndex);
        if (!weekMap) continue;

        const weekValues = weekMap.get(key);
        if (!weekValues || weekValues.length === 0) continue;

        const weekAvg = weekValues.reduce((a, b) => a + b, 0) / weekValues.length;
        const weight = WEEK_WEIGHTS[weekIndex];

        weightedSum += weekAvg * weight;
        totalWeight += weight;
        values.push(weekAvg);
      }

      // Calculate prediction
      const predictedUtilization =
        totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

      // Calculate confidence based on data variance and availability
      let confidence = 0;
      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance =
          values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        // Higher confidence with more data and lower variance
        const dataScore = Math.min(100, values.length * 25); // Max 100 at 4 weeks
        const varianceScore = Math.max(0, 100 - stdDev * 2);

        confidence = Math.round((dataScore + varianceScore) / 2);
      }

      predictions.push({
        hour,
        dayOfWeek,
        predictedUtilization,
        confidence,
      });
    }
  }

  // Find peak and low demand hours
  const sortedByUtilization = [...predictions].sort(
    (a, b) => b.predictedUtilization - a.predictedUtilization
  );

  const peakHours = sortedByUtilization.slice(0, 5).map((p) => ({
    dayOfWeek: p.dayOfWeek,
    hour: p.hour,
    utilization: p.predictedUtilization,
  }));

  const lowDemandHours = sortedByUtilization
    .slice(-5)
    .reverse()
    .filter((p) => p.predictedUtilization < 50)
    .map((p) => ({
      dayOfWeek: p.dayOfWeek,
      hour: p.hour,
      utilization: p.predictedUtilization,
    }));

  // Calculate next week start date
  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));
  const weekStartDate = nextMonday.toISOString().split('T')[0];

  return {
    weekStartDate,
    predictions,
    peakHours,
    lowDemandHours,
  };
}

export async function storePredictions(forecast: WeeklyForecast): Promise<void> {
  // Store predictions as a setting for quick retrieval
  const key = `predictions_${forecast.weekStartDate}`;
  const value = JSON.stringify(forecast);

  await prisma.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getStoredPredictions(): Promise<WeeklyForecast | null> {
  // Get the most recent predictions
  const settings = await prisma.settings.findMany({
    where: {
      key: { startsWith: 'predictions_' },
    },
    orderBy: { key: 'desc' },
    take: 1,
  });

  if (settings.length === 0) return null;

  try {
    return JSON.parse(settings[0].value);
  } catch {
    return null;
  }
}
