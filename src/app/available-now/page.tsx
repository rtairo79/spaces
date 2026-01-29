'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { AvailableNowList } from '@/components/walkin/AvailableNowList';
import { QuickBookForm } from '@/components/walkin/QuickBookForm';

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

interface Location {
  id: string;
  name: string;
}

export default function AvailableNowPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null);

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

  const handleSelectRoom = (room: AvailableRoom) => {
    setSelectedRoom(room);
  };

  const handleBookingSuccess = () => {
    setSelectedRoom(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Available Now
          </h1>
          <p className="mt-1 text-gray-600">
            Book a room for immediate use - no advance reservation needed
          </p>
        </div>

        {/* Location filter */}
        <div className="mb-6 flex items-center gap-4">
          <MapPin className="h-5 w-5 text-gray-400" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="flex-1 border rounded-md px-3 py-2"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Available rooms list */}
        <AvailableNowList
          locationId={selectedLocation}
          onSelectRoom={handleSelectRoom}
        />

        {/* Quick book modal */}
        {selectedRoom && (
          <QuickBookForm
            selectedRoom={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            onSuccess={handleBookingSuccess}
          />
        )}
      </div>
    </div>
  );
}
