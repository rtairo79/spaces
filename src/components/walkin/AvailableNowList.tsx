'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, Users, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailableRoom {
  room: {
    id: string;
    name: string;
    capacity: number;
    location: {
      id: string;
      name: string;
    };
  };
  availableUntil: string;
  wasReleased: boolean;
  originalReservationId?: string;
}

interface AvailableNowListProps {
  locationId?: string;
  onSelectRoom?: (room: AvailableRoom) => void;
}

export function AvailableNowList({ locationId, onSelectRoom }: AvailableNowListProps) {
  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (locationId) {
        params.set('locationId', locationId);
      }

      const res = await fetch(`/api/walkins/available?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms);
        setCurrentTime(data.currentTime);
      } else {
        setError('Failed to load available rooms');
      }
    } catch (err) {
      setError('Failed to load available rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();

    // Refresh every 2 minutes
    const interval = setInterval(fetchRooms, 120000);
    return () => clearInterval(interval);
  }, [locationId]);

  const calculateDuration = (availableUntil: string): string => {
    const [endHour, endMin] = availableUntil.split(':').map(Number);
    const [currentHour, currentMin] = currentTime.split(':').map(Number);

    const endMinutes = endHour * 60 + endMin;
    const currentMinutes = currentHour * 60 + currentMin;
    const diffMinutes = endMinutes - currentMinutes;

    if (diffMinutes >= 60) {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${diffMinutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchRooms}
          className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-700">No Rooms Available</h3>
        <p className="text-gray-500 mt-1">
          All rooms are currently booked. Check back later or view the calendar for future availability.
        </p>
        <button
          onClick={fetchRooms}
          className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-white border rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {rooms.length} room{rooms.length !== 1 ? 's' : ''} available now
        </p>
        <button
          onClick={fetchRooms}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {rooms.map((item) => (
          <div
            key={item.room.id}
            className={cn(
              'bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer',
              item.wasReleased && 'border-green-300 bg-green-50'
            )}
            onClick={() => onSelectRoom?.(item)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{item.room.name}</h3>
                  {item.wasReleased && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Just Released
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {item.room.location.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {item.room.capacity} people
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  <Clock className="h-4 w-4" />
                  Until {item.availableUntil}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ({calculateDuration(item.availableUntil)} available)
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
