'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/feature-card';

interface HourlyPrediction {
  hour: number;
  dayOfWeek: number;
  predictedUtilization: number;
  confidence: number;
}

interface PeakHour {
  dayOfWeek: number;
  hour: number;
  utilization: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export function UsagePredictionsTab() {
  const [predictions, setPredictions] = useState<HourlyPrediction[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [lowDemandHours, setLowDemandHours] = useState<PeakHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgConfidence, setAvgConfidence] = useState(0);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const res = await fetch('/api/predictions/weekly');
        if (res.ok) {
          const data = await res.json();
          setPredictions(data.predictions || []);
          setPeakHours(data.peakHours || []);
          setLowDemandHours(data.lowDemandHours || []);

          if (data.predictions?.length > 0) {
            const avg = data.predictions.reduce((sum: number, p: HourlyPrediction) => sum + p.confidence, 0) / data.predictions.length;
            setAvgConfidence(Math.round(avg));
          }
        }
      } catch (error) {
        console.error('Error fetching predictions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPredictions();
  }, []);

  const formatHour = (hour: number): string => {
    if (hour === 12) return '12pm';
    if (hour > 12) return `${hour - 12}pm`;
    return `${hour}am`;
  };

  const getIntensityClass = (utilization: number): string => {
    if (utilization >= 80) return 'bg-red-500 text-white';
    if (utilization >= 60) return 'bg-orange-400 text-white';
    if (utilization >= 40) return 'bg-yellow-400 text-slate-900';
    if (utilization >= 20) return 'bg-green-300 text-slate-900';
    return 'bg-green-100 text-slate-700';
  };

  const getPrediction = (dayOfWeek: number, hour: number) => {
    return predictions.find((p) => p.dayOfWeek === dayOfWeek && p.hour === hour);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid3" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid3)" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Usage Predictions</h2>
            </div>
            <p className="text-purple-100 max-w-xl">
              Machine learning forecasts help you plan ahead by predicting when spaces
              will be busy or available throughout the week.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <div className="text-center px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <div className="text-3xl font-bold">{avgConfidence}%</div>
              <div className="text-sm text-purple-200">Confidence</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <h4 className="font-semibold text-slate-900">Busiest Times</h4>
          </div>
          <div className="space-y-2">
            {peakHours.slice(0, 3).map((peak, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {DAY_NAMES[peak.dayOfWeek]} {formatHour(peak.hour)}
                </span>
                <span className="font-medium text-red-600 flex items-center gap-1">
                  {peak.utilization}%
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-semibold text-slate-900">Best Availability</h4>
          </div>
          <div className="space-y-2">
            {lowDemandHours.slice(0, 3).map((low, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {DAY_NAMES[low.dayOfWeek]} {formatHour(low.hour)}
                </span>
                <span className="font-medium text-green-600 flex items-center gap-1">
                  {low.utilization}%
                  <ArrowDownRight className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-900">Prediction Quality</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Data points</span>
              <span className="font-medium text-slate-900">{predictions.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Weeks analyzed</span>
              <span className="font-medium text-slate-900">4</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Model accuracy</span>
              <span className="font-medium text-slate-900">{avgConfidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Weekly Demand Forecast
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100" />
              Low
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-400" />
              Medium
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              High
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Hour headers */}
              <div className="flex mb-2">
                <div className="w-20 shrink-0" />
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="flex-1 text-center text-xs text-slate-500 font-medium"
                  >
                    {formatHour(hour)}
                  </div>
                ))}
              </div>

              {/* Day rows */}
              {DAY_FULL.map((dayName, dayIndex) => (
                <div key={dayIndex} className="flex items-center mb-1">
                  <div className="w-20 shrink-0 text-sm text-slate-600 pr-3 text-right">
                    {dayName}
                  </div>
                  <div className="flex-1 flex gap-1">
                    {HOURS.map((hour) => {
                      const prediction = getPrediction(dayIndex, hour);
                      const utilization = prediction?.predictedUtilization || 0;

                      return (
                        <div
                          key={hour}
                          className={`flex-1 h-10 rounded flex items-center justify-center text-xs font-medium transition-all hover:scale-105 cursor-default ${getIntensityClass(utilization)}`}
                          title={`${dayName} ${formatHour(hour)}: ${utilization}% predicted`}
                        >
                          {utilization > 0 && utilization}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Tips */}
      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
        <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Booking Tips Based on Predictions
        </h4>
        <ul className="space-y-2 text-sm text-purple-700">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
            Green times have the best availability - book these for flexible meetings
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
            Book red/orange times well in advance to secure your preferred space
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
            Consider alternative times if your first choice is predicted to be busy
          </li>
        </ul>
      </div>
    </div>
  );
}
