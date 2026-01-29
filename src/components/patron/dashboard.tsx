// src/components/patron/dashboard.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  LogOut,
  Search,
  Filter,
  X,
  CheckCircle,
} from 'lucide-react';
import type {
  Location,
  Room,
  ProgramType,
  ReservationFormData,
} from '@/types';

export function PatronDashboard({ session }: { session: Session }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [meetingPolicy, setMeetingPolicy] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<ReservationFormData>({
    roomId: '',
    locationId: '',
    programTypeId: '',
    date: '',
    startTime: '',
    endTime: '',
    requesterName: session.user.name || '',
    requesterEmail: session.user.email || '',
    requesterPhone: '',
    libraryCardId: '',
    organizationName: '',
    notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [locationsRes, programTypesRes, policyRes] = await Promise.all([
        fetch('/api/locations?active=true'),
        fetch('/api/program-types?active=true'),
        fetch('/api/settings?key=meeting_room_policy'),
      ]);

      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setLocations(data);
      }

      if (programTypesRes.ok) {
        const data = await programTypesRes.json();
        setProgramTypes(data);
      }

      if (policyRes.ok) {
        const data = await policyRes.json();
        setMeetingPolicy(data.value || 'Please follow library rules and regulations.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const url = `/api/rooms?active=true${selectedLocation ? `&locationId=${selectedLocation}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, [selectedLocation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedLocation) {
      fetchRooms();
    }
  }, [selectedLocation, fetchRooms]);

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      ...formData,
      roomId: room.id,
      locationId: room.locationId,
    });
    setShowBookingForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!policyAccepted) {
      setMessage({ type: 'error', text: 'Please accept the meeting room policy to continue.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Your request has been submitted. You will receive a confirmation email shortly.',
        });
        setShowBookingForm(false);
        setPolicyAccepted(false);
        setFormData({
          roomId: '',
          locationId: '',
          programTypeId: '',
          date: '',
          startTime: '',
          endTime: '',
          requesterName: session.user.name || '',
          requesterEmail: session.user.email || '',
          requesterPhone: '',
          libraryCardId: '',
          organizationName: '',
          notes: '',
        });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit reservation.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (selectedLocation && room.locationId !== selectedLocation) return false;
    if (selectedDate) {
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();
      const hasTimeSlot = room.timeSlots.some((slot) => slot.dayOfWeek === dayOfWeek);
      if (!hasTimeSlot) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 sm:px-8 lg:px-16 xl:px-24 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Library Room Booking</h1>
                <p className="text-sm text-gray-500">Book meeting rooms and study spaces</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Success/Error Message */}
      {message && (
        <div className="px-6 sm:px-8 lg:px-16 xl:px-24 mt-4">
          <div
            className={`rounded-lg p-4 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
              <p className="font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="px-6 sm:px-8 lg:px-16 xl:px-24 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Find a Room</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedLocation('');
                  setSelectedDate('');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Available Rooms */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Available Rooms ({filteredRooms.length})
          </h2>

          {filteredRooms.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No rooms found matching your criteria.</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 border border-gray-200"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {room.name}
                    </h3>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {room.roomType.name}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{room.location.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Capacity: {room.capacity} people</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {room.timeSlots.length > 0
                          ? `${room.timeSlots[0].startTime} - ${room.timeSlots[0].endTime}`
                          : 'Various times'}
                      </span>
                    </div>
                  </div>

                  {room.description && (
                    <p className="text-sm text-gray-600 mb-4">{room.description}</p>
                  )}

                  <button
                    onClick={() => handleRoomSelect(room)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Request Booking
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Booking Form Modal */}
      {showBookingForm && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Book {selectedRoom.name}
              </h3>
              <button
                onClick={() => {
                  setShowBookingForm(false);
                  setPolicyAccepted(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Room Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">{selectedRoom.location.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">Capacity: {selectedRoom.capacity}</span>
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Program Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Type *
                </label>
                <select
                  required
                  value={formData.programTypeId}
                  onChange={(e) => setFormData({ ...formData, programTypeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select program type</option>
                  {programTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.requesterName}
                    onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.requesterEmail}
                    onChange={(e) => setFormData({ ...formData, requesterEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.requesterPhone}
                    onChange={(e) => setFormData({ ...formData, requesterPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Library Card ID
                  </label>
                  <input
                    type="text"
                    value={formData.libraryCardId}
                    onChange={(e) => setFormData({ ...formData, libraryCardId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name (if applicable)
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special requirements or notes..."
                />
              </div>

              {/* Meeting Room Policy */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-2">Meeting Room Policy</h4>
                <div className="text-sm text-gray-700 whitespace-pre-line mb-3 max-h-40 overflow-y-auto">
                  {meetingPolicy}
                </div>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={(e) => setPolicyAccepted(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and accept the meeting room policy *
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting || !policyAccepted}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false);
                    setPolicyAccepted(false);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}