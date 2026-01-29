'use client';

import { useState } from 'react';
import { Search, CheckCircle, XCircle, Loader2, Building2 } from 'lucide-react';

interface CheckInResult {
  success: boolean;
  message: string;
  reservation?: {
    room: string;
    location: string;
    startTime: string;
    endTime: string;
  };
}

export default function KioskPage() {
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Search for reservation by email or library card
      const today = new Date().toISOString().split('T')[0];
      const searchParams = new URLSearchParams({
        dateFrom: today,
        dateTo: today,
        status: 'APPROVED',
      });

      const res = await fetch(`/api/reservations?${searchParams}`);
      if (!res.ok) {
        throw new Error('Failed to search reservations');
      }

      const reservations = await res.json();

      // Find matching reservation (by email or library card)
      const searchLower = searchValue.toLowerCase().trim();
      const matching = reservations.find(
        (r: Record<string, unknown>) =>
          (r.requesterEmail as string)?.toLowerCase() === searchLower ||
          (r.libraryCardId as string)?.toLowerCase() === searchLower
      );

      if (!matching) {
        setError('No reservation found for today. Please check your email or library card number.');
        return;
      }

      // Check if already checked in
      if (matching.checkInStatus === 'CHECKED_IN') {
        setResult({
          success: true,
          message: 'You are already checked in!',
          reservation: {
            room: matching.room?.name || 'Unknown',
            location: matching.location?.name || 'Unknown',
            startTime: matching.startTime,
            endTime: matching.endTime,
          },
        });
        return;
      }

      // Attempt check-in
      const checkInRes = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: matching.id }),
      });

      const checkInData = await checkInRes.json();

      if (checkInRes.ok) {
        setResult({
          success: true,
          message: 'Successfully checked in!',
          reservation: checkInData.reservation,
        });
      } else {
        setError(checkInData.message || checkInData.error || 'Check-in failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again or ask staff for assistance.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchValue('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">Room Check-In</h1>
          <p className="text-blue-100 mt-2">
            Enter your email or library card number to check in
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {!result ? (
            <form onSubmit={handleSearch} className="p-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email or Library Card Number
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Enter your email or card number"
                      className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !searchValue.trim()}
                  className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Checking in...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Check In
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  result.success ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-10 w-10 text-green-600" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-600" />
                )}
              </div>

              <h2
                className={`text-2xl font-bold mb-2 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {result.message}
              </h2>

              {result.reservation && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl text-left">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Your Reservation
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p>
                      <span className="font-medium">Room:</span>{' '}
                      {result.reservation.room}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span>{' '}
                      {result.reservation.location}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span>{' '}
                      {result.reservation.startTime} - {result.reservation.endTime}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleReset}
                className="mt-6 w-full py-4 border-2 border-gray-200 text-gray-700 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Check In Another Person
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-sm mt-6">
          Need help? Please ask a staff member for assistance.
        </p>
      </div>
    </div>
  );
}
