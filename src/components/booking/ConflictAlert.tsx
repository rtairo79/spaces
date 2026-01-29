'use client';

import { AlertTriangle, Clock, Calendar } from 'lucide-react';
import { SuggestedSlot } from '@/types';

interface ConflictAlertProps {
  error: string;
  conflictingReservation?: {
    id: string;
    startTime: string;
    endTime: string;
    requesterName: string;
  };
  alternativeSlots?: SuggestedSlot[];
  onSelectAlternative?: (slot: SuggestedSlot) => void;
}

export function ConflictAlert({
  error,
  conflictingReservation,
  alternativeSlots = [],
  onSelectAlternative,
}: ConflictAlertProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-red-800">Booking Conflict</h4>
          <p className="mt-1 text-sm text-red-700">{error}</p>

          {conflictingReservation && (
            <div className="mt-2 text-sm text-red-600">
              <p>
                Existing booking: {conflictingReservation.startTime} -{' '}
                {conflictingReservation.endTime}
              </p>
            </div>
          )}

          {alternativeSlots.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-800 text-sm">
                Available alternatives:
              </h5>
              <ul className="mt-2 space-y-2">
                {alternativeSlots.map((slot, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => onSelectAlternative?.(slot)}
                      className="flex items-center gap-2 w-full text-left p-2 rounded-md bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {formatDate(slot.date)}
                        </span>
                        <Clock className="h-4 w-4 text-gray-500 ml-2" />
                        <span className="text-sm">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{slot.reason}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
