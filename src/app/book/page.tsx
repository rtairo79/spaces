'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { ConflictAlert } from '@/components/booking/ConflictAlert';
import { SuggestedSlots } from '@/components/suggestions/SuggestedSlots';

interface Location {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  capacity: number;
  locationId: string;
  location: Location;
}

interface ProgramType {
  id: string;
  name: string;
}

interface ConflictData {
  valid: boolean;
  error?: string;
  conflictingReservation?: {
    id: string;
    startTime: string;
    endTime: string;
    requesterName: string;
  };
  alternativeSlots?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    score: number;
    reason: string;
  }>;
}

function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [locations, setLocations] = useState<Location[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [conflict, setConflict] = useState<ConflictData | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    locationId: searchParams.get('locationId') || '',
    roomId: searchParams.get('roomId') || '',
    date: searchParams.get('date') || new Date().toISOString().split('T')[0],
    startTime: searchParams.get('startTime') || '09:00',
    endTime: searchParams.get('endTime') || '10:00',
    programTypeId: '',
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    notes: '',
  });

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const [locRes, roomRes, progRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/rooms'),
          fetch('/api/program-types'),
        ]);

        if (locRes.ok) {
          const data = await locRes.json();
          setLocations(data);
        }

        if (roomRes.ok) {
          const data = await roomRes.json();
          setRooms(data);
        }

        if (progRes.ok) {
          const data = await progRes.json();
          setProgramTypes(data);
          if (data.length > 0 && !formData.programTypeId) {
            setFormData((prev) => ({ ...prev, programTypeId: data[0].id }));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Validate when time/room changes
  useEffect(() => {
    if (!formData.roomId || !formData.date || !formData.startTime || !formData.endTime) {
      setConflict(null);
      return;
    }

    const validateBooking = async () => {
      setValidating(true);
      try {
        const res = await fetch('/api/reservations/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: formData.roomId,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setConflict(data.valid ? null : data);
        }
      } catch (error) {
        console.error('Error validating:', error);
      } finally {
        setValidating(false);
      }
    };

    const debounce = setTimeout(validateBooking, 500);
    return () => clearTimeout(debounce);
  }, [formData.roomId, formData.date, formData.startTime, formData.endTime]);

  const filteredRooms = formData.locationId
    ? rooms.filter((r) => r.locationId === formData.locationId)
    : rooms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (conflict && !conflict.valid) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAlternative = (slot: { date: string; startTime: string; endTime: string }) => {
    setFormData((prev) => ({
      ...prev,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
    setConflict(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Space Booked!</h2>
          <p className="text-slate-600 mb-6">
            Your reservation has been submitted. You&apos;ll receive a confirmation email shortly.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/spaces')}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  ...formData,
                  requesterName: '',
                  requesterEmail: '',
                  requesterPhone: '',
                  notes: '',
                });
              }}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Book Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Book This Space</h1>
            <p className="text-slate-600">Reserve a room for your meeting or study session</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
                {/* Location & Room */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Location
                    </label>
                    <select
                      value={formData.locationId}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          locationId: e.target.value,
                          roomId: '',
                        }));
                      }}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">All locations</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Room *
                    </label>
                    <select
                      required
                      value={formData.roomId}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, roomId: e.target.value }))
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">Select a room</option>
                      {filteredRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} ({room.capacity} people)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, date: e.target.value }))
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Conflict Alert */}
                {validating && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking availability...
                  </div>
                )}

                {conflict && !conflict.valid && (
                  <ConflictAlert
                    error={conflict.error || 'Booking conflict detected'}
                    conflictingReservation={conflict.conflictingReservation}
                    alternativeSlots={conflict.alternativeSlots}
                    onSelectAlternative={handleSelectAlternative}
                  />
                )}

                {!conflict && formData.roomId && !validating && (
                  <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-4 py-3 rounded-xl">
                    <CheckCircle className="w-4 h-4" />
                    Space is available for this time
                  </div>
                )}

                {/* Program Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Purpose *
                  </label>
                  <select
                    required
                    value={formData.programTypeId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, programTypeId: e.target.value }))
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    {programTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.requesterName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, requesterName: e.target.value }))
                      }
                      placeholder="John Doe"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.requesterEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, requesterEmail: e.target.value }))
                      }
                      placeholder="john@example.com"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.requesterPhone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, requesterPhone: e.target.value }))
                    }
                    placeholder="(555) 123-4567"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={3}
                    placeholder="Any special requirements or notes..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || (conflict !== null && !conflict.valid)}
                  className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Book This Space
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Sidebar - Suggestions */}
            <div className="space-y-6">
              {formData.roomId && (
                <SuggestedSlots
                  roomId={formData.roomId}
                  preferredStartTime={formData.startTime}
                  duration={60}
                  onSelectSlot={handleSelectAlternative}
                />
              )}

              {/* Tips */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Booking Tips
                </h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                    Check in within 15 minutes of your start time
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                    Unclaimed spaces are released for walk-ins
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                    You&apos;ll receive reminders before your booking
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
