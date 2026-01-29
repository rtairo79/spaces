'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

interface ReleasedRoom {
  id: string;
  roomName: string;
  locationName: string;
  endTime: string;
}

interface RoomReleasedBannerProps {
  locationId?: string;
  onDismiss?: () => void;
}

export function RoomReleasedBanner({ locationId, onDismiss }: RoomReleasedBannerProps) {
  const [releasedRooms, setReleasedRooms] = useState<ReleasedRoom[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchReleasedRooms() {
      try {
        const params = new URLSearchParams();
        if (locationId) {
          params.set('locationId', locationId);
        }

        const res = await fetch(`/api/walkins/available?${params}`);
        if (res.ok) {
          const data = await res.json();
          // Filter to only show rooms that were released (not just naturally available)
          const released = data.rooms
            .filter((r: { wasReleased: boolean }) => r.wasReleased)
            .map((r: { room: { id: string; name: string; location: { name: string } }; availableUntil: string }) => ({
              id: r.room.id,
              roomName: r.room.name,
              locationName: r.room.location.name,
              endTime: r.availableUntil,
            }));
          setReleasedRooms(released);
        }
      } catch (error) {
        console.error('Error fetching released rooms:', error);
      }
    }

    fetchReleasedRooms();

    // Refresh every 2 minutes
    const interval = setInterval(fetchReleasedRooms, 120000);
    return () => clearInterval(interval);
  }, [locationId]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || releasedRooms.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">
              {releasedRooms.length} room{releasedRooms.length > 1 ? 's' : ''} just
              became available!
            </p>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-green-100">
              {releasedRooms.slice(0, 3).map((room) => (
                <span key={room.id} className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {room.roomName}
                  <Clock className="h-3 w-3 ml-1" />
                  until {room.endTime}
                </span>
              ))}
              {releasedRooms.length > 3 && (
                <span>+{releasedRooms.length - 3} more</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/available-now"
            className="px-4 py-2 bg-white text-green-600 font-medium rounded-md hover:bg-green-50 transition-colors text-sm"
          >
            Book Now
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
