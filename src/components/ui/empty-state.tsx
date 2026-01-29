'use client';

import { Calendar, Search, FileText, Users, Inbox, FolderOpen } from 'lucide-react';
import { ReactNode } from 'react';

type EmptyStateType = 'search' | 'reservations' | 'rooms' | 'reports' | 'default';

interface EmptyStateProps {
  type?: EmptyStateType;
  title: string;
  description?: string;
  action?: ReactNode;
}

const icons = {
  search: Search,
  reservations: Calendar,
  rooms: FolderOpen,
  reports: FileText,
  default: Inbox,
};

const gradients = {
  search: 'from-blue-500 to-cyan-500',
  reservations: 'from-purple-500 to-pink-500',
  rooms: 'from-green-500 to-emerald-500',
  reports: 'from-orange-500 to-amber-500',
  default: 'from-gray-400 to-gray-500',
};

export function EmptyState({ type = 'default', title, description, action }: EmptyStateProps) {
  const Icon = icons[type];
  const gradient = gradients[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Decorative background */}
      <div className="relative mb-6">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 blur-2xl rounded-full scale-150`}></div>
        <div className={`relative w-20 h-20 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 text-center max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}

      {/* Decorative dots */}
      <div className="flex items-center gap-1 mt-8">
        <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${gradient} opacity-60`}></div>
        <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${gradient} opacity-40`}></div>
        <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${gradient} opacity-20`}></div>
      </div>
    </div>
  );
}

export function NoSearchResults() {
  return (
    <EmptyState
      type="search"
      title="No results found"
      description="Try adjusting your search or filter criteria to find what you're looking for."
    />
  );
}

export function NoReservations() {
  return (
    <EmptyState
      type="reservations"
      title="No reservations yet"
      description="When you make room reservations, they'll appear here for you to manage."
    />
  );
}

export function NoRooms() {
  return (
    <EmptyState
      type="rooms"
      title="No rooms available"
      description="There are no rooms matching your criteria. Try selecting a different location or date."
    />
  );
}
