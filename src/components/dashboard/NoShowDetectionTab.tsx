'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserX,
  Clock,
  Bell,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/feature-card';

interface ReleasedSpace {
  id: string;
  roomName: string;
  locationName: string;
  originalTime: string;
  releasedAt: string;
  availableUntil: string;
  wasBooked: boolean;
}

export function NoShowDetectionTab() {
  const [releasedSpaces, setReleasedSpaces] = useState<ReleasedSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNoShows: 0,
    spacesRecovered: 0,
    avgGracePeriod: 15,
    emailsSent: 0,
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch available spaces that were released
        const res = await fetch('/api/walkins/available');
        if (res.ok) {
          const data = await res.json();
          const released = data.rooms
            ?.filter((r: { wasReleased: boolean }) => r.wasReleased)
            ?.map((r: { room: { id: string; name: string; location: { name: string } }; availableUntil: string; originalReservationId: string }) => ({
              id: r.originalReservationId || r.room.id,
              roomName: r.room.name,
              locationName: r.room.location.name,
              originalTime: 'Earlier today',
              releasedAt: new Date().toLocaleTimeString(),
              availableUntil: r.availableUntil,
              wasBooked: false,
            })) || [];
          setReleasedSpaces(released);
        }

        // Mock stats for demo
        setStats({
          totalNoShows: 23,
          spacesRecovered: 18,
          avgGracePeriod: 15,
          emailsSent: 46,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const processSteps = [
    {
      icon: Clock,
      title: 'Grace Period Starts',
      description: 'Reservation start time passes without check-in',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      icon: Bell,
      title: 'Reminder Sent',
      description: 'Patron receives notification to check in',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: UserX,
      title: 'No-Show Detected',
      description: 'Grace period expires without check-in',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      icon: RefreshCw,
      title: 'Space Released',
      description: 'Space becomes available for walk-ins',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid4" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid4)" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <UserX className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">No-Show Detection</h2>
            </div>
            <p className="text-rose-100 max-w-xl">
              Automatically detect when patrons don&apos;t show up and release their spaces
              for others to use. Maximize space utilization with smart grace periods.
            </p>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="text-center px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <div className="text-3xl font-bold">{stats.spacesRecovered}</div>
              <div className="text-sm text-rose-200">Recovered</div>
            </div>
            <div className="text-center px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <div className="text-3xl font-bold">{stats.avgGracePeriod}m</div>
              <div className="text-sm text-rose-200">Grace Period</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="No-Shows This Month"
          value={stats.totalNoShows}
          icon={UserX}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <StatCard
          title="Spaces Recovered"
          value={stats.spacesRecovered}
          icon={RefreshCw}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Recovery Rate"
          value={`${Math.round((stats.spacesRecovered / stats.totalNoShows) * 100)}%`}
          icon={Zap}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-50"
        />
        <StatCard
          title="Notifications Sent"
          value={stats.emailsSent}
          icon={Mail}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
      </div>

      {/* Process Flow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          How No-Show Detection Works
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {processSteps.map((step, index) => (
            <div key={index} className="relative">
              {index < processSteps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-slate-200 -translate-x-1/2 z-0">
                  <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                </div>
              )}

              <div className="relative z-10 text-center">
                <div
                  className={`w-16 h-16 mx-auto rounded-2xl ${step.bg} flex items-center justify-center mb-4`}
                >
                  <step.icon className={`w-8 h-8 ${step.color}`} />
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">{step.title}</h4>
                <p className="text-sm text-slate-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recently Released Spaces */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Recently Released Spaces
          </h3>
          <a
            href="/available-now"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all available
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto" />
          </div>
        ) : releasedSpaces.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {releasedSpaces.map((space) => (
              <div
                key={space.id}
                className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{space.roomName}</div>
                    <div className="text-sm text-slate-500">{space.locationName}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-slate-900">
                    Available until {space.availableUntil}
                  </div>
                  <div className="text-xs text-slate-500">Released just now</div>
                </div>

                <a
                  href="/available-now"
                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Book Now
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-medium text-slate-700 mb-1">No recently released spaces</h4>
            <p className="text-sm text-slate-500">
              Spaces will appear here when they&apos;re released due to no-shows
            </p>
          </div>
        )}
      </motion.div>

      {/* Configuration Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            Grace Period Settings
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Default grace period</span>
              <span className="font-medium text-slate-900">15 minutes</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Check-in window opens</span>
              <span className="font-medium text-slate-900">15 min before start</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Auto-release trigger</span>
              <span className="font-medium text-slate-900">Every 5 minutes</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Notification Settings
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">24-hour reminder</span>
              <span className="font-medium text-blue-900">Enabled</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">1-hour reminder</span>
              <span className="font-medium text-blue-900">Enabled</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">Release notification</span>
              <span className="font-medium text-blue-900">Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
