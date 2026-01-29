'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reservation {
  id: string;
  room: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  requesterName: string;
  requesterEmail: string;
  status: string;
  checkInStatus: string;
  checkedInAt?: string;
}

interface StaffCheckInPanelProps {
  locationId?: string;
}

export function StaffCheckInPanel({ locationId }: StaffCheckInPanelProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's reservations
  useEffect(() => {
    async function fetchReservations() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const params = new URLSearchParams({
          dateFrom: today,
          dateTo: today,
          status: 'APPROVED',
        });

        if (locationId) {
          params.set('locationId', locationId);
        }

        const res = await fetch(`/api/reservations?${params}`);
        if (res.ok) {
          const data = await res.json();
          setReservations(
            data.map((r: Record<string, unknown>) => ({
              id: r.id,
              room: (r.room as Record<string, unknown>)?.name || 'Unknown',
              location: (r.location as Record<string, unknown>)?.name || 'Unknown',
              date: r.date,
              startTime: r.startTime,
              endTime: r.endTime,
              requesterName: r.requesterName,
              requesterEmail: r.requesterEmail,
              status: r.status,
              checkInStatus: r.checkInStatus || 'NOT_CHECKED_IN',
              checkedInAt: r.checkedInAt,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();

    // Refresh every minute
    const interval = setInterval(fetchReservations, 60000);
    return () => clearInterval(interval);
  }, [locationId]);

  const handleCheckIn = async (reservationId: string, override: boolean = false) => {
    setCheckingIn(reservationId);
    setError(null);

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, override }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update local state
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? { ...r, checkInStatus: 'CHECKED_IN', checkedInAt: data.reservation.checkedInAt }
              : r
          )
        );
      } else {
        setError(data.error || 'Check-in failed');
      }
    } catch (err) {
      setError('Failed to check in. Please try again.');
    } finally {
      setCheckingIn(null);
    }
  };

  // Filter reservations by search query
  const filteredReservations = reservations.filter(
    (r) =>
      r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requesterEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.room.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by start time, then by check-in status
  const sortedReservations = [...filteredReservations].sort((a, b) => {
    if (a.startTime < b.startTime) return -1;
    if (a.startTime > b.startTime) return 1;
    if (a.checkInStatus === 'NOT_CHECKED_IN' && b.checkInStatus === 'CHECKED_IN') return -1;
    if (a.checkInStatus === 'CHECKED_IN' && b.checkInStatus === 'NOT_CHECKED_IN') return 1;
    return 0;
  });

  const getStatusBadge = (checkInStatus: string) => {
    switch (checkInStatus) {
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            <CheckCircle className="h-3 w-3" />
            Checked In
          </span>
        );
      case 'NO_SHOW':
      case 'AUTO_RELEASED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
            <AlertTriangle className="h-3 w-3" />
            {checkInStatus === 'NO_SHOW' ? 'No Show' : 'Released'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Today&apos;s Check-ins</h2>
        <p className="text-sm text-gray-500">
          {reservations.filter((r) => r.checkInStatus === 'CHECKED_IN').length} of{' '}
          {reservations.length} checked in
        </p>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Reservation list */}
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {sortedReservations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No reservations found for today
          </div>
        ) : (
          sortedReservations.map((reservation) => {
            const isLate = (() => {
              const now = new Date();
              const [startHour, startMin] = reservation.startTime.split(':').map(Number);
              const startTime = new Date();
              startTime.setHours(startHour, startMin, 0, 0);
              return now > startTime && reservation.checkInStatus === 'NOT_CHECKED_IN';
            })();

            return (
              <div
                key={reservation.id}
                className={cn(
                  'p-4 hover:bg-gray-50',
                  isLate && 'bg-yellow-50'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {reservation.requesterName}
                      </span>
                      {getStatusBadge(reservation.checkInStatus)}
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{reservation.room}</span>
                      <span className="mx-2">·</span>
                      <span>
                        {reservation.startTime} - {reservation.endTime}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {reservation.requesterEmail}
                    </div>
                    {reservation.checkedInAt && (
                      <div className="text-xs text-green-600 mt-1">
                        Checked in at{' '}
                        {new Date(reservation.checkedInAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  {reservation.checkInStatus === 'NOT_CHECKED_IN' && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleCheckIn(reservation.id)}
                        disabled={checkingIn === reservation.id}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {checkingIn === reservation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Check In'
                        )}
                      </button>
                      {isLate && (
                        <button
                          onClick={() => handleCheckIn(reservation.id, true)}
                          disabled={checkingIn === reservation.id}
                          className="px-3 py-1.5 border border-yellow-500 text-yellow-700 text-sm rounded-md hover:bg-yellow-50"
                        >
                          Override Late
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
