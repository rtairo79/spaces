'use client';

import { cn } from '@/lib/utils';

interface TimeSlotProps {
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
  onClick?: () => void;
  compact?: boolean;
}

export function TimeSlot({
  startTime,
  endTime,
  status,
  reservation,
  onClick,
  compact = false,
}: TimeSlotProps) {
  const statusColors = {
    available: 'bg-green-100 hover:bg-green-200 border-green-300 cursor-pointer',
    booked: 'bg-gray-200 border-gray-300',
    yours: 'bg-blue-100 hover:bg-blue-200 border-blue-300 cursor-pointer',
    unavailable: 'bg-gray-100 border-gray-200 text-gray-400',
  };

  const statusLabels = {
    available: 'Available',
    booked: 'Booked',
    yours: 'Your Booking',
    unavailable: 'Unavailable',
  };

  return (
    <div
      className={cn(
        'border rounded-md p-2 transition-colors',
        statusColors[status],
        compact ? 'text-xs' : 'text-sm'
      )}
      onClick={status === 'available' || status === 'yours' ? onClick : undefined}
      role={status === 'available' || status === 'yours' ? 'button' : undefined}
      tabIndex={status === 'available' || status === 'yours' ? 0 : undefined}
      onKeyDown={(e) => {
        if ((status === 'available' || status === 'yours') && (e.key === 'Enter' || e.key === ' ')) {
          onClick?.();
        }
      }}
    >
      <div className="font-medium">
        {startTime} - {endTime}
      </div>
      {!compact && (
        <div className="mt-1 text-xs text-gray-600">
          {reservation ? (
            <>
              <div className="truncate">{reservation.requesterName}</div>
              <div className="text-gray-500">{reservation.programType}</div>
              {reservation.checkInStatus === 'CHECKED_IN' && (
                <span className="inline-block mt-1 px-1.5 py-0.5 bg-green-500 text-white rounded text-[10px]">
                  Checked In
                </span>
              )}
            </>
          ) : (
            <span className={cn(
              status === 'available' ? 'text-green-700' : 'text-gray-500'
            )}>
              {statusLabels[status]}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
