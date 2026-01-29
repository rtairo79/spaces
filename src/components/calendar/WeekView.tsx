'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TimeSlot } from './TimeSlot';

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
      reservation?: {
        id: string;
        requesterName: string;
        programType: string;
        status: string;
        checkInStatus: string;
      };
    }>;
  }>;
}

interface WeekViewProps {
  days: CalendarDay[];
  rooms: Array<{ id: string; name: string; locationName: string }>;
  selectedRoomId?: string;
  onSlotClick?: (roomId: string, date: string, startTime: string, endTime: string) => void;
  onWeekChange?: (startDate: Date) => void;
  weekStartDate: Date;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

export function WeekView({
  days,
  rooms,
  selectedRoomId,
  onSlotClick,
  onWeekChange,
  weekStartDate,
}: WeekViewProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStartDate);
      day.setDate(day.getDate() + i);
      result.push(day);
    }
    return result;
  }, [weekStartDate]);

  const handlePrevWeek = () => {
    const newStart = new Date(weekStartDate);
    newStart.setDate(newStart.getDate() - 7);
    onWeekChange?.(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(weekStartDate);
    newStart.setDate(newStart.getDate() + 7);
    onWeekChange?.(newStart);
  };

  const handleToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    onWeekChange?.(sunday);
  };

  const getSlotForDateAndTime = (roomId: string, date: string, hour: number) => {
    const dayData = days.find((d) => d.date === date);
    if (!dayData) return null;

    const roomData = dayData.rooms[roomId];
    if (!roomData) return null;

    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    return roomData.slots.find((s) => s.startTime === timeStr);
  };

  const filteredRooms = selectedRoomId
    ? rooms.filter((r) => r.id === selectedRoomId)
    : rooms;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-gray-100 rounded-md"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded-md"
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
          >
            Today
          </button>
        </div>
        <h2 className="text-lg font-semibold">
          {weekStartDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-200 border border-green-300" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
            <span>Your booking</span>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 text-sm font-medium text-gray-500 border-r">
              Time
            </div>
            {weekDays.map((day, index) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={index}
                  className={`p-2 text-center border-r last:border-r-0 ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-500">
                    {DAY_NAMES[day.getDay()]}
                  </div>
                  <div
                    className={`text-lg ${
                      isToday
                        ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                        : ''
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          {filteredRooms.map((room) => (
            <div key={room.id} className="border-b last:border-b-0">
              <div className="px-3 py-2 bg-gray-50 text-sm font-medium border-b">
                {room.name}
                <span className="text-gray-500 font-normal ml-2">
                  ({room.locationName})
                </span>
              </div>

              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                  <div className="p-2 text-sm text-gray-500 border-r text-right pr-3">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const slot = getSlotForDateAndTime(room.id, dateStr, hour);
                    const slotKey = `${room.id}-${dateStr}-${hour}`;

                    return (
                      <div
                        key={dayIndex}
                        className="p-1 border-r last:border-r-0 min-h-[60px]"
                        onMouseEnter={() => setHoveredSlot(slotKey)}
                        onMouseLeave={() => setHoveredSlot(null)}
                      >
                        {slot ? (
                          <TimeSlot
                            startTime={slot.startTime}
                            endTime={slot.endTime}
                            status={slot.status}
                            reservation={slot.reservation}
                            compact
                            onClick={() =>
                              onSlotClick?.(
                                room.id,
                                dateStr,
                                slot.startTime,
                                slot.endTime
                              )
                            }
                          />
                        ) : (
                          <div className="h-full bg-gray-50 rounded" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
