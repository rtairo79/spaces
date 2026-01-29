'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Clock, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestedSlot {
  date: string;
  startTime: string;
  endTime: string;
  score: number;
  reason: string;
}

interface SuggestedSlotsProps {
  roomId: string;
  preferredStartTime?: string;
  duration?: number;
  onSelectSlot?: (slot: SuggestedSlot) => void;
  className?: string;
}

export function SuggestedSlots({
  roomId,
  preferredStartTime,
  duration = 60,
  onSelectSlot,
  className,
}: SuggestedSlotsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      if (!roomId) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/suggestions/times', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            preferredStartTime,
            duration,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions);
        } else {
          setError('Failed to load suggestions');
        }
      } catch (err) {
        setError('Failed to load suggestions');
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [roomId, preferredStartTime, duration]);

  if (loading) {
    return (
      <div className={cn('p-4 bg-blue-50 rounded-lg', className)}>
        <div className="flex items-center gap-2 text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Finding best times...</span>
        </div>
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn('p-4 bg-blue-50 rounded-lg', className)}>
      <div className="flex items-center gap-2 text-blue-700 mb-3">
        <Lightbulb className="h-4 w-4" />
        <span className="text-sm font-medium">Suggested Times</span>
      </div>

      <div className="space-y-2">
        {suggestions.slice(0, 5).map((slot, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelectSlot?.(slot)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-md border border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-100 rounded-md">
                <span className="text-xs text-blue-600">
                  {new Date(slot.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                  })}
                </span>
                <span className="text-sm font-bold text-blue-800">
                  {new Date(slot.date).getDate()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  <Clock className="h-3 w-3" />
                  {slot.startTime} - {slot.endTime}
                </div>
                <div className="text-xs text-gray-500">{slot.reason}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  slot.score >= 80
                    ? 'bg-green-500'
                    : slot.score >= 60
                    ? 'bg-yellow-500'
                    : 'bg-orange-500'
                )}
              />
              <span className="text-xs text-gray-400">{slot.score}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
