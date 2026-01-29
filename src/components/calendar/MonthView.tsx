'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarDay {
  date: string;
  dayOfWeek: number;
  rooms: Record<string, {
    roomId: string;
    roomName: string;
    locationName: string;
    slots: Array<{
      startTime: string;
      endTime: string;
      status: 'available' | 'booked' | 'yours' | 'unavailable';
    }>;
  }>;
}

interface MonthViewProps {
  days: CalendarDay[];
  currentMonth: Date;
  onMonthChange?: (month: Date) => void;
  onDayClick?: (date: string) => void;
  selectedRoomId?: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthView({
  days,
  currentMonth,
  onMonthChange,
  onDayClick,
  selectedRoomId,
}: MonthViewProps) {
  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Build calendar grid
    const grid: (Date | null)[] = [];

    // Add empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(new Date(year, month, day));
    }

    // Add empty cells to complete last week
    while (grid.length % 7 !== 0) {
      grid.push(null);
    }

    return grid;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    onMonthChange?.(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    onMonthChange?.(newMonth);
  };

  const getDayStats = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = days.find((d) => d.date === dateStr);

    if (!dayData) return { available: 0, booked: 0, yours: 0 };

    let available = 0;
    let booked = 0;
    let yours = 0;

    const roomIds = selectedRoomId
      ? [selectedRoomId]
      : Object.keys(dayData.rooms);

    for (const roomId of roomIds) {
      const roomData = dayData.rooms[roomId];
      if (!roomData) continue;

      for (const slot of roomData.slots) {
        if (slot.status === 'available') available++;
        else if (slot.status === 'booked') booked++;
        else if (slot.status === 'yours') yours++;
      }
    }

    return { available, booked, yours };
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-md"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-md"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <h2 className="text-lg font-semibold">
          {currentMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </h2>
        <div className="w-24" /> {/* Spacer for alignment */}
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="p-2 text-center text-sm font-medium text-gray-500"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {monthDays.map((date, index) => {
          if (!date) {
            return (
              <div
                key={index}
                className="min-h-[100px] p-2 border-r border-b bg-gray-50 last:border-r-0"
              />
            );
          }

          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
          const stats = getDayStats(date);
          const hasBookings = stats.booked > 0 || stats.yours > 0;
          const hasAvailability = stats.available > 0;

          return (
            <div
              key={index}
              className={cn(
                'min-h-[100px] p-2 border-r border-b cursor-pointer hover:bg-gray-50 transition-colors',
                isToday && 'bg-blue-50',
                isPast && 'bg-gray-50 text-gray-400',
                '[&:nth-child(7n)]:border-r-0'
              )}
              onClick={() => !isPast && onDayClick?.(date.toISOString().split('T')[0])}
            >
              <div
                className={cn(
                  'text-sm font-medium mb-2',
                  isToday &&
                    'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                )}
              >
                {date.getDate()}
              </div>

              {!isPast && (
                <div className="space-y-1">
                  {stats.yours > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs text-blue-700">
                        {stats.yours} booking{stats.yours > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {hasAvailability && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-green-700">
                        {stats.available} slot{stats.available > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {!hasAvailability && hasBookings && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-xs text-gray-500">Fully booked</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
