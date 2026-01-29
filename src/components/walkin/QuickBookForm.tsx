'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Loader2, X } from 'lucide-react';

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

interface ProgramType {
  id: string;
  name: string;
}

interface QuickBookFormProps {
  selectedRoom: AvailableRoom;
  onClose: () => void;
  onSuccess?: (reservation: { id: string; room: string; startTime: string; endTime: string }) => void;
}

export function QuickBookForm({ selectedRoom, onClose, onSuccess }: QuickBookFormProps) {
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    programTypeId: '',
    duration: 30,
  });

  // Fetch program types
  useEffect(() => {
    async function fetchProgramTypes() {
      try {
        const res = await fetch('/api/program-types');
        if (res.ok) {
          const data = await res.json();
          setProgramTypes(data);
          if (data.length > 0) {
            setFormData((prev) => ({ ...prev, programTypeId: data[0].id }));
          }
        }
      } catch (err) {
        console.error('Error fetching program types:', err);
      }
    }
    fetchProgramTypes();
  }, []);

  // Calculate max duration
  const calculateMaxDuration = (): number => {
    const [endHour, endMin] = selectedRoom.availableUntil.split(':').map(Number);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = endHour * 60 + endMin;
    return Math.min(120, endMinutes - currentMinutes);
  };

  const maxDuration = calculateMaxDuration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/walkins/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom.room.id,
          locationId: selectedRoom.room.location.id,
          programTypeId: formData.programTypeId,
          duration: formData.duration,
          requesterName: formData.requesterName,
          requesterEmail: formData.requesterEmail,
          requesterPhone: formData.requesterPhone || undefined,
          originalReservationId: selectedRoom.originalReservationId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        onSuccess?.(data.reservation);
      } else {
        setError(data.error || 'Failed to create booking');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-4">
            You&apos;re all set for {selectedRoom.room.name}.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Quick Book</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 bg-blue-50 border-b">
          <h3 className="font-medium text-blue-900">{selectedRoom.room.name}</h3>
          <p className="text-sm text-blue-700">
            {selectedRoom.room.location.name} • Available until {selectedRoom.availableUntil}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={formData.requesterName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, requesterName: e.target.value }))
              }
              className="w-full border rounded-md px-3 py-2"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.requesterEmail}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, requesterEmail: e.target.value }))
              }
              className="w-full border rounded-md px-3 py-2"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={formData.requesterPhone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, requesterPhone: e.target.value }))
              }
              className="w-full border rounded-md px-3 py-2"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <select
              value={formData.programTypeId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, programTypeId: e.target.value }))
              }
              className="w-full border rounded-md px-3 py-2"
            >
              {programTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <select
              value={formData.duration}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) }))
              }
              className="w-full border rounded-md px-3 py-2"
            >
              {[15, 30, 45, 60, 90, 120]
                .filter((d) => d <= maxDuration)
                .map((d) => (
                  <option key={d} value={d}>
                    {d >= 60 ? `${d / 60} hour${d > 60 ? 's' : ''}` : `${d} minutes`}
                  </option>
                ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
