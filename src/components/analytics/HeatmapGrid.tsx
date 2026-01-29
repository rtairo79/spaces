'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface HeatmapData {
  dayOfWeek: number;
  hour: number;
  value: number;
}

interface HeatmapGridProps {
  data: HeatmapData[];
  title?: string;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

export function HeatmapGrid({ data, title }: HeatmapGridProps) {
  const maxValue = useMemo(() => {
    return Math.max(...data.map((d) => d.value), 1);
  }, [data]);

  const getIntensity = (value: number): string => {
    const ratio = value / maxValue;
    if (ratio === 0) return 'bg-gray-100';
    if (ratio < 0.25) return 'bg-blue-100';
    if (ratio < 0.5) return 'bg-blue-200';
    if (ratio < 0.75) return 'bg-blue-400';
    return 'bg-blue-600';
  };

  const getTextColor = (value: number): string => {
    const ratio = value / maxValue;
    return ratio >= 0.5 ? 'text-white' : 'text-gray-700';
  };

  const getValue = (dayOfWeek: number, hour: number): number => {
    const entry = data.find((d) => d.dayOfWeek === dayOfWeek && d.hour === hour);
    return entry?.value || 0;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour headers */}
          <div className="flex">
            <div className="w-12" /> {/* Spacer for day labels */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="flex-1 text-center text-xs text-gray-500 pb-1"
              >
                {hour.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {DAY_LABELS.map((dayLabel, dayIndex) => (
            <div key={dayIndex} className="flex items-center">
              <div className="w-12 text-xs text-gray-500 pr-2 text-right">
                {dayLabel}
              </div>
              <div className="flex-1 flex gap-0.5">
                {HOURS.map((hour) => {
                  const value = getValue(dayIndex, hour);
                  return (
                    <div
                      key={hour}
                      className={cn(
                        'flex-1 aspect-square rounded-sm flex items-center justify-center text-xs font-medium transition-colors',
                        getIntensity(value),
                        getTextColor(value)
                      )}
                      title={`${dayLabel} ${hour}:00 - ${value} bookings`}
                    >
                      {value > 0 && value}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-0.5">
          <div className="w-4 h-4 rounded-sm bg-gray-100" />
          <div className="w-4 h-4 rounded-sm bg-blue-100" />
          <div className="w-4 h-4 rounded-sm bg-blue-200" />
          <div className="w-4 h-4 rounded-sm bg-blue-400" />
          <div className="w-4 h-4 rounded-sm bg-blue-600" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
