'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { FeatureCard, StatCard } from '@/components/ui/feature-card';

interface ConflictExample {
  id: string;
  requestedTime: string;
  conflictWith: string;
  status: 'resolved' | 'pending';
  alternatives: Array<{ time: string; score: number }>;
}

export function ConflictResolutionTab() {
  const [showDemo, setShowDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const conflictExamples: ConflictExample[] = [
    {
      id: '1',
      requestedTime: 'Monday 2:00 PM - 3:00 PM',
      conflictWith: 'Team Meeting (Conference Room A)',
      status: 'resolved',
      alternatives: [
        { time: '3:00 PM - 4:00 PM', score: 95 },
        { time: '1:00 PM - 2:00 PM', score: 88 },
      ],
    },
    {
      id: '2',
      requestedTime: 'Wednesday 10:00 AM - 11:00 AM',
      conflictWith: 'Study Group (Room 201)',
      status: 'pending',
      alternatives: [
        { time: '11:00 AM - 12:00 PM', score: 92 },
        { time: '9:00 AM - 10:00 AM', score: 85 },
      ],
    },
  ];

  const runDemo = () => {
    setShowDemo(true);
    setDemoStep(0);
    const steps = [1, 2, 3, 4];
    steps.forEach((step, index) => {
      setTimeout(() => setDemoStep(step), (index + 1) * 1000);
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid2" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2)" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Conflict Resolution</h2>
            </div>
            <p className="text-orange-100 max-w-xl">
              Automatically detect double-bookings and overlapping reservations before they happen,
              with instant alternative suggestions.
            </p>
          </div>

          <button
            onClick={runDemo}
            className="hidden lg:flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
          >
            <Zap className="w-5 h-5" />
            See Demo
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Conflicts Prevented"
          value="247"
          change={12}
          trend="up"
          icon={ShieldAlert}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <StatCard
          title="Auto-Resolved"
          value="89%"
          icon={CheckCircle2}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Avg Resolution Time"
          value="< 1s"
          icon={Clock}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="This Week"
          value="12"
          icon={Calendar}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Interactive Demo */}
      {showDemo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border-2 border-orange-200 p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Real-time Conflict Detection Demo
            </h3>
            <button
              onClick={() => setShowDemo(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { step: 1, label: 'User books space', icon: Calendar },
              { step: 2, label: 'Conflict detected', icon: AlertTriangle },
              { step: 3, label: 'AI finds alternatives', icon: RefreshCw },
              { step: 4, label: 'User selects option', icon: CheckCircle2 },
            ].map((item) => (
              <div
                key={item.step}
                className={`text-center p-4 rounded-xl transition-all duration-500 ${
                  demoStep >= item.step
                    ? 'bg-orange-50 border-2 border-orange-300'
                    : 'bg-slate-50 border-2 border-transparent'
                }`}
              >
                <div
                  className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 transition-colors ${
                    demoStep >= item.step ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                </div>
                <div className={`text-sm font-medium ${demoStep >= item.step ? 'text-orange-700' : 'text-slate-500'}`}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {demoStep >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200"
            >
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Conflict resolved! Alternative space booked.</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* How It Works */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeatureCard
          title="Pre-Submission Validation"
          description="Conflicts are caught before you submit, not after. Our system checks availability in real-time as you select your preferred time."
          icon={ShieldAlert}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        >
          <div className="mt-4 p-4 bg-orange-50 rounded-xl">
            <code className="text-sm text-orange-800">
              POST /api/reservations/validate
            </code>
            <p className="text-xs text-orange-600 mt-2">
              Validates before form submission
            </p>
          </div>
        </FeatureCard>

        <FeatureCard
          title="Instant Alternatives"
          description="When a conflict is detected, you immediately see scored alternatives based on proximity to your preferred time and historical availability."
          icon={Zap}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-50"
        >
          <div className="mt-4 space-y-2">
            {[
              { time: '3:00 PM - 4:00 PM', score: 95, label: 'Best match' },
              { time: '1:00 PM - 2:00 PM', score: 88, label: 'Good option' },
            ].map((alt, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">{alt.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{alt.label}</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {alt.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </FeatureCard>
      </div>

      {/* Recent Conflicts */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">Recent Conflict Resolutions</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {conflictExamples.map((conflict) => (
            <div key={conflict.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-slate-900">{conflict.requestedTime}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        conflict.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {conflict.status === 'resolved' ? 'Resolved' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Conflicted with: {conflict.conflictWith}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">Alternatives offered:</div>
                  <div className="space-y-1">
                    {conflict.alternatives.slice(0, 2).map((alt, i) => (
                      <div key={i} className="text-sm text-slate-600">
                        {alt.time} ({alt.score}%)
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
