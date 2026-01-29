'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Clock,
  CalendarDays,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { FeatureCard, StatCard } from '@/components/ui/feature-card';

interface SuggestedSpace {
  date: string;
  startTime: string;
  endTime: string;
  score: number;
  reason: string;
}

interface RoomSuggestion {
  roomId: string;
  roomName: string;
  locationName: string;
  score: number;
  availableSlots: SuggestedSpace[];
}

export function SmartSchedulingTab() {
  const [suggestions, setSuggestions] = useState<SuggestedSpace[]>([]);
  const [roomSuggestions, setRoomSuggestions] = useState<RoomSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  useEffect(() => {
    async function fetchSuggestions() {
      setLoading(true);
      try {
        // Fetch time suggestions for demo
        const timesRes = await fetch('/api/suggestions/times', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: selectedRoom || undefined,
            duration: 60,
          }),
        });

        if (timesRes.ok) {
          const data = await timesRes.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [selectedRoom]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Smart Scheduling</h2>
            </div>
            <p className="text-blue-100 max-w-xl">
              AI-powered suggestions help you find the perfect time and space for your needs,
              based on historical usage patterns and availability.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <div className="text-center px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <div className="text-3xl font-bold">{suggestions.length}</div>
              <div className="text-sm text-blue-200">Suggestions</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Optimal Spaces Found"
          value={suggestions.filter(s => s.score >= 80).length}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Low-Demand Periods"
          value={suggestions.filter(s => s.reason.includes('Low demand')).length}
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Days Analyzed"
          value="7"
          icon={CalendarDays}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Suggestions Grid */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Recommended Spaces
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.slice(0, 6).map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500">
                    {formatDate(suggestion.date)}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getScoreColor(suggestion.score)}`} />
                    <span className="text-sm font-semibold text-slate-700">
                      {suggestion.score}% match
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-xl font-bold text-slate-900">
                    {suggestion.startTime} - {suggestion.endTime}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mb-4">{suggestion.reason}</p>

                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  Book This Space
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-12 text-center">
            <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-700 mb-2">
              No suggestions available
            </h4>
            <p className="text-slate-500">
              Select a room to get personalized space recommendations
            </p>
          </div>
        )}
      </div>

      {/* How It Works */}
      <FeatureCard
        title="How Smart Scheduling Works"
        description="Our AI analyzes booking patterns to suggest optimal times"
        icon={Sparkles}
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {[
            { step: '1', title: 'Analyze Patterns', desc: 'Historical usage data reveals peak and quiet times' },
            { step: '2', title: 'Score Options', desc: 'Each available space is scored based on multiple factors' },
            { step: '3', title: 'Recommend Best', desc: 'Top matches are presented with confidence scores' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <div className="font-medium text-slate-900">{item.title}</div>
                <div className="text-sm text-slate-500">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </FeatureCard>
    </div>
  );
}
