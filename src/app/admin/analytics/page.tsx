'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Calendar, RefreshCw } from 'lucide-react';
import { StatsCards } from '@/components/analytics/StatsCards';
import { UtilizationChart } from '@/components/analytics/UtilizationChart';
import { HeatmapGrid } from '@/components/analytics/HeatmapGrid';

interface AnalyticsSummary {
  totalReservations: number;
  totalCheckIns: number;
  totalNoShows: number;
  totalWalkIns: number;
  checkInRate: number;
  noShowRate: number;
  utilizationPercent: number;
}

interface HourlyData {
  hour: number;
  reservationCount: number;
  checkInCount: number;
  checkInRate: number;
  avgUtilizationMins: number;
}

interface HeatmapData {
  dayOfWeek: number;
  hour: number;
  value: number;
}

interface WeeklyTrend {
  weekStart: string;
  weekEnd: string;
  totalReservations: number;
  utilizationPercent: number;
  reservationChange: number;
  checkInChange: number;
  utilizationChange: number;
}

interface RoomComparison {
  roomId: string;
  roomName: string;
  locationName: string;
  totalReservations: number;
  checkInRate: number;
  noShowRate: number;
  utilizationPercent: number;
}

interface Location {
  id: string;
  name: string;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
  const [roomComparison, setRoomComparison] = useState<RoomComparison[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);

  // Fetch locations
  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    }
    fetchLocations();
  }, []);

  // Fetch all analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      if (selectedLocation) {
        params.set('locationId', selectedLocation);
      }

      // Fetch all data in parallel
      const [summaryRes, hourlyRes, trendsRes] = await Promise.all([
        fetch(`/api/analytics/summary?${params}`),
        fetch(`/api/analytics/hourly?${params}`),
        fetch(`/api/analytics/trends?${params}`),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary);
      }

      if (hourlyRes.ok) {
        const data = await hourlyRes.json();
        setHourlyData(data.hourlyBreakdown);
        setHeatmapData(data.heatmap);
      }

      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setWeeklyTrends(data.weeklyTrends);
        setRoomComparison(data.roomComparison);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedLocation]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const latestTrend = weeklyTrends[weeklyTrends.length - 1];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Usage Analytics
            </h1>
            <p className="mt-1 text-gray-600">
              Room booking metrics and trends
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm min-w-[150px]"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        {loading && !summary ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="mb-6">
                <StatsCards
                  summary={summary}
                  changes={
                    latestTrend
                      ? {
                          reservationChange: latestTrend.reservationChange,
                          checkInChange: latestTrend.checkInChange,
                          utilizationChange: latestTrend.utilizationChange,
                        }
                      : undefined
                  }
                />
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Weekly Trends Chart */}
              {weeklyTrends.length > 0 && (
                <UtilizationChart
                  title="Weekly Utilization Trend"
                  data={weeklyTrends.map((w) => ({
                    label: new Date(w.weekStart).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    }),
                    value: w.utilizationPercent,
                  }))}
                  valueLabel="Utilization %"
                />
              )}

              {/* Hourly Distribution Chart */}
              {hourlyData.length > 0 && (
                <UtilizationChart
                  title="Hourly Booking Distribution"
                  data={hourlyData.map((h) => ({
                    label: `${h.hour.toString().padStart(2, '0')}:00`,
                    value: h.checkInRate,
                    secondary: h.reservationCount,
                  }))}
                  valueLabel="Check-in Rate %"
                  secondaryLabel="Reservations"
                />
              )}
            </div>

            {/* Heatmap */}
            {heatmapData.length > 0 && (
              <div className="mb-6">
                <HeatmapGrid
                  title="Booking Heatmap (Day x Hour)"
                  data={heatmapData}
                />
              </div>
            )}

            {/* Room Comparison Table */}
            {roomComparison.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold">Room Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Room
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Location
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Reservations
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Check-in Rate
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          No-Show Rate
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Utilization
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {roomComparison.map((room) => (
                        <tr key={room.roomId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">
                            {room.roomName}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {room.locationName}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {room.totalReservations}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                room.checkInRate >= 80
                                  ? 'bg-green-100 text-green-700'
                                  : room.checkInRate >= 60
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {room.checkInRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                room.noShowRate <= 10
                                  ? 'bg-green-100 text-green-700'
                                  : room.noShowRate <= 20
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {room.noShowRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {room.utilizationPercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
