'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HourlyPrediction {
  hour: number;
  dayOfWeek: number;
  predictedUtilization: number;
  confidence: number;
}

interface PeakHour {
  dayOfWeek: number;
  hour: number;
  utilization: number;
}

interface WeeklyForecastProps {
  weekStartDate: string;
  predictions: HourlyPrediction[];
  peakHours: PeakHour[];
  lowDemandHours: PeakHour[];
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export function WeeklyForecast({
  weekStartDate,
  predictions,
  peakHours,
  lowDemandHours,
}: WeeklyForecastProps) {
  const predictionMap = useMemo(() => {
    const map = new Map<string, HourlyPrediction>();
    predictions.forEach((p) => {
      map.set(`${p.dayOfWeek}-${p.hour}`, p);
    });
    return map;
  }, [predictions]);

  const getIntensityClass = (utilization: number): string => {
    if (utilization >= 80) return 'bg-red-500';
    if (utilization >= 60) return 'bg-orange-400';
    if (utilization >= 40) return 'bg-yellow-400';
    if (utilization >= 20) return 'bg-green-300';
    return 'bg-green-100';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 80) return 'High';
    if (confidence >= 50) return 'Medium';
    return 'Low';
  };

  const avgConfidence = useMemo(() => {
    if (predictions.length === 0) return 0;
    return Math.round(
      predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    );
  }, [predictions]);

  const formatHour = (hour: number): string => {
    if (hour === 12) return '12pm';
    if (hour > 12) return `${hour - 12}pm`;
    return `${hour}am`;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Peak Hours Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-red-600 mb-3">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-semibold">Busiest Times</h3>
          </div>
          <ul className="space-y-2">
            {peakHours.slice(0, 3).map((peak, index) => (
              <li key={index} className="flex items-center justify-between text-sm">
                <span>
                  {DAY_SHORT[peak.dayOfWeek]} {formatHour(peak.hour)}
                </span>
                <span className="font-medium text-red-600">{peak.utilization}%</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Low Demand Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-green-600 mb-3">
            <TrendingDown className="h-5 w-5" />
            <h3 className="font-semibold">Best Availability</h3>
          </div>
          <ul className="space-y-2">
            {lowDemandHours.slice(0, 3).map((low, index) => (
              <li key={index} className="flex items-center justify-between text-sm">
                <span>
                  {DAY_SHORT[low.dayOfWeek]} {formatHour(low.hour)}
                </span>
                <span className="font-medium text-green-600">{low.utilization}%</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Confidence Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-3">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold">Prediction Quality</h3>
          </div>
          <div className="text-center py-2">
            <div className="text-3xl font-bold text-gray-900">{avgConfidence}%</div>
            <div className="text-sm text-gray-500">
              {getConfidenceLabel(avgConfidence)} Confidence
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Based on {predictions.filter((p) => p.confidence > 0).length} data points
          </p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            Weekly Demand Forecast
          </h3>
          <span className="text-sm text-gray-500">
            Week of {new Date(weekStartDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour headers */}
            <div className="flex">
              <div className="w-20 shrink-0" />
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs text-gray-500 pb-2"
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Day rows */}
            {DAY_NAMES.map((dayName, dayIndex) => (
              <div key={dayIndex} className="flex items-center mb-1">
                <div className="w-20 shrink-0 text-sm text-gray-600 pr-2">
                  {dayName}
                </div>
                <div className="flex-1 flex gap-0.5">
                  {HOURS.map((hour) => {
                    const prediction = predictionMap.get(`${dayIndex}-${hour}`);
                    const utilization = prediction?.predictedUtilization || 0;
                    const confidence = prediction?.confidence || 0;

                    return (
                      <div
                        key={hour}
                        className={cn(
                          'flex-1 h-8 rounded-sm flex items-center justify-center text-xs font-medium transition-colors cursor-default',
                          getIntensityClass(utilization),
                          utilization >= 60 ? 'text-white' : 'text-gray-700'
                        )}
                        title={`${dayName} ${formatHour(hour)}: ${utilization}% predicted (${getConfidenceLabel(confidence)} confidence)`}
                      >
                        {utilization > 0 && utilization}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-sm bg-green-100" />
            <span>Low (&lt;20%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-sm bg-green-300" />
            <span>Light (20-40%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-sm bg-yellow-400" />
            <span>Moderate (40-60%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-sm bg-orange-400" />
            <span>Busy (60-80%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-sm bg-red-500" />
            <span>Peak (&gt;80%)</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Booking Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • Green times have the best availability - book these for flexible meetings
          </li>
          <li>
            • Book red/orange times well in advance to secure your preferred room
          </li>
          <li>
            • Consider alternative times if your first choice is predicted to be busy
          </li>
        </ul>
      </div>
    </div>
  );
}
