'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckInButtonProps {
  reservationId: string;
  onCheckInComplete?: () => void;
  className?: string;
}

interface CheckInStatus {
  canCheckIn: boolean;
  message: string;
  checkInStatus: string;
  checkedInAt?: string;
}

export function CheckInButton({
  reservationId,
  onCheckInComplete,
  className,
}: CheckInButtonProps) {
  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch check-in status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/checkin/${reservationId}`);
        const data = await res.json();

        if (res.ok) {
          setStatus({
            canCheckIn: data.canCheckIn,
            message: data.message,
            checkInStatus: data.reservation.checkInStatus,
            checkedInAt: data.reservation.checkedInAt,
          });
        } else {
          setError(data.error || 'Failed to fetch status');
        }
      } catch (err) {
        setError('Failed to fetch check-in status');
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [reservationId]);

  const handleCheckIn = async () => {
    setChecking(true);
    setError(null);

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          canCheckIn: false,
          message: 'Checked in',
          checkInStatus: 'CHECKED_IN',
          checkedInAt: data.reservation.checkedInAt,
        });
        onCheckInComplete?.();
      } else {
        setError(data.error || 'Check-in failed');
      }
    } catch (err) {
      setError('Failed to check in. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-gray-500', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (status?.checkInStatus === 'CHECKED_IN') {
    return (
      <div className={cn('flex items-center gap-2 text-green-600', className)}>
        <CheckCircle className="h-5 w-5" />
        <div>
          <span className="text-sm font-medium">Checked In</span>
          {status.checkedInAt && (
            <span className="text-xs text-gray-500 ml-2">
              at {new Date(status.checkedInAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (status?.checkInStatus === 'AUTO_RELEASED' || status?.checkInStatus === 'NO_SHOW') {
    return (
      <div className={cn('flex items-center gap-2 text-red-600', className)}>
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">Reservation Released</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {status?.canCheckIn ? (
        <button
          onClick={handleCheckIn}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking in...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Check In Now
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{status?.message}</span>
        </div>
      )}
    </div>
  );
}
