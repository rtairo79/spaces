'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Grid3X3, List } from 'lucide-react';
import { WeekView } from '@/components/calendar/WeekView';
import { MonthView } from '@/components/calendar/MonthView';
import { cn } from '@/lib/utils';

type ViewMode = 'week' | 'month';

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

interface RoomOption {
  id: string;
  name: string;
  locationName: string;
}

interface LocationOption {
  id: string;
  name: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    return sunday;
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch locations
  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    }
    fetchLocations();
  }, []);

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      if (viewMode === 'week') {
        startDate = weekStartDate;
        endDate = new Date(weekStartDate);
        endDate.setDate(endDate.getDate() + 6);
      } else {
        startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      if (selectedRoomId) {
        params.set('roomId', selectedRoomId);
      }

      if (selectedLocationId) {
        params.set('locationId', selectedLocationId);
      }

      const res = await fetch(`/api/calendar?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDays(data.days);
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, [viewMode, weekStartDate, currentMonth, selectedRoomId, selectedLocationId]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Handle slot click - navigate to booking page
  const handleSlotClick = (roomId: string, date: string, startTime: string, endTime: string) => {
    const params = new URLSearchParams({
      roomId,
      date,
      startTime,
      endTime,
    });
    router.push(`/book?${params}`);
  };

  // Handle day click in month view - switch to week view for that day
  const handleDayClick = (date: string) => {
    const clickedDate = new Date(date);
    const dayOfWeek = clickedDate.getDay();
    const weekStart = new Date(clickedDate);
    weekStart.setDate(clickedDate.getDate() - dayOfWeek);
    setWeekStartDate(weekStart);
    setViewMode('week');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Room Calendar
          </h1>
          <p className="mt-1 text-gray-600">
            View availability and book rooms
          </p>
        </div>

        {/* Filters and view toggle */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            {/* Location filter */}
            <select
              value={selectedLocationId}
              onChange={(e) => {
                setSelectedLocationId(e.target.value);
                setSelectedRoomId(''); // Reset room when location changes
              }}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>

            {/* Room filter */}
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Rooms</option>
              {rooms
                .filter((r) => !selectedLocationId || true) // Rooms already filtered by API
                .map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.locationName})
                  </option>
                ))}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'px-4 py-2 text-sm font-medium flex items-center gap-2',
                viewMode === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <List className="h-4 w-4" />
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-4 py-2 text-sm font-medium flex items-center gap-2',
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <Grid3X3 className="h-4 w-4" />
              Month
            </button>
          </div>
        </div>

        {/* Calendar view */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-500">Loading calendar...</p>
          </div>
        ) : viewMode === 'week' ? (
          <WeekView
            days={days}
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            weekStartDate={weekStartDate}
            onWeekChange={setWeekStartDate}
            onSlotClick={handleSlotClick}
          />
        ) : (
          <MonthView
            days={days}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onDayClick={handleDayClick}
            selectedRoomId={selectedRoomId}
          />
        )}

        {/* Mobile hint */}
        <div className="mt-4 text-center text-sm text-gray-500 sm:hidden">
          Scroll horizontally to see all days
        </div>
      </div>
    </div>
  );
}
