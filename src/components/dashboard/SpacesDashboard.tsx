'use client';

import { motion } from 'framer-motion';
import {
  Sparkles,
  ShieldAlert,
  BarChart3,
  UserX,
  Calendar,
  Clock,
  Building2,
} from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { SmartSchedulingTab } from './SmartSchedulingTab';
import { ConflictResolutionTab } from './ConflictResolutionTab';
import { UsagePredictionsTab } from './UsagePredictionsTab';
import { NoShowDetectionTab } from './NoShowDetectionTab';

export function SpacesDashboard() {
  const tabs = [
    {
      id: 'smart-scheduling',
      label: 'Smart Scheduling',
      icon: Sparkles,
      content: <SmartSchedulingTab />,
    },
    {
      id: 'conflict-resolution',
      label: 'Conflict Resolution',
      icon: ShieldAlert,
      content: <ConflictResolutionTab />,
    },
    {
      id: 'usage-predictions',
      label: 'Usage Predictions',
      icon: BarChart3,
      content: <UsagePredictionsTab />,
    },
    {
      id: 'no-show-detection',
      label: 'No-Show Detection',
      icon: UserX,
      content: <NoShowDetectionTab />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Library Spaces</h1>
                <p className="text-xs text-slate-500">AI-Powered Room Booking</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a
                href="/calendar"
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium text-sm"
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </a>
              <a
                href="/available-now"
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium text-sm"
              >
                <Clock className="w-4 h-4" />
                Available Now
              </a>
              <a
                href="/book"
                className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md text-sm"
              >
                Book a Space
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="heroGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heroGrid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">AI-Powered Features</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Smarter Space Management
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Leverage machine learning to optimize bookings, prevent conflicts,
              predict demand, and maximize space utilization.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/book"
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Book This Space
              </a>
              <a
                href="/calendar"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
              >
                View Calendar
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs tabs={tabs} defaultTab="smart-scheduling" />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="w-5 h-5" />
              <span className="font-medium">Library Spaces</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="/calendar" className="hover:text-blue-600 transition-colors">
                Calendar
              </a>
              <a href="/available-now" className="hover:text-blue-600 transition-colors">
                Available Now
              </a>
              <a href="/predictions" className="hover:text-blue-600 transition-colors">
                Predictions
              </a>
              <a href="/admin/analytics" className="hover:text-blue-600 transition-colors">
                Analytics
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
