'use client';

import { Users, CheckCircle, XCircle, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  description?: string;
  positive?: 'up' | 'down';
}

function StatCard({ title, value, change, icon, description, positive }: StatCardProps) {
  const changeIsGood =
    positive === 'up' ? (change || 0) > 0 : (change || 0) < 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="text-gray-500">{icon}</div>
        {change !== undefined && (
          <span
            className={cn(
              'text-sm font-medium',
              changeIsGood ? 'text-green-600' : 'text-red-600'
            )}
          >
            {change > 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

interface StatsCardsProps {
  summary: {
    totalReservations: number;
    totalCheckIns: number;
    totalNoShows: number;
    totalWalkIns: number;
    checkInRate: number;
    noShowRate: number;
    utilizationPercent: number;
  };
  changes?: {
    reservationChange?: number;
    checkInChange?: number;
    utilizationChange?: number;
  };
}

export function StatsCards({ summary, changes }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Reservations"
        value={summary.totalReservations}
        change={changes?.reservationChange}
        icon={<Users className="h-5 w-5" />}
        positive="up"
      />
      <StatCard
        title="Check-in Rate"
        value={`${summary.checkInRate}%`}
        change={changes?.checkInChange}
        icon={<CheckCircle className="h-5 w-5" />}
        description={`${summary.totalCheckIns} checked in`}
        positive="up"
      />
      <StatCard
        title="No-Show Rate"
        value={`${summary.noShowRate}%`}
        icon={<XCircle className="h-5 w-5" />}
        description={`${summary.totalNoShows} no-shows`}
        positive="down"
      />
      <StatCard
        title="Utilization"
        value={`${summary.utilizationPercent}%`}
        change={changes?.utilizationChange}
        icon={<TrendingUp className="h-5 w-5" />}
        description={`${summary.totalWalkIns} walk-ins`}
        positive="up"
      />
    </div>
  );
}
