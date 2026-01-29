'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Loader2, MapPin } from 'lucide-react';
import { WeeklyForecast } from '@/components/predictions/WeeklyForecast';

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

interface ForecastData {
  weekStartDate: string;
  predictions: HourlyPrediction[];
  peakHours: PeakHour[];
  lowDemandHours: PeakHour[];
  source: string;
}

interface Location {
  id: string;
  name: string;
}

export default function PredictionsPage() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch locations
  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
    }
    fetchLocations();
  }, []);

  // Fetch predictions
  const fetchPredictions = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedLocation) {
        params.set('locationId', selectedLocation);
      }
      if (refresh) {
        params.set('refresh', 'true');
      }

      const res = await fetch(`/api/predictions/weekly?${params}`);
      if (res.ok) {
        const data = await res.json();
        setForecast(data);
      } else {
        setError('Failed to load predictions');
      }
    } catch (err) {
      setError('Failed to load predictions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [selectedLocation]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Weekly Predictions
            </h1>
            <p className="mt-1 text-gray-600">
              See when rooms are likely to be busy or available
            </p>
          </div>
          <button
            onClick={() => fetchPredictions(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Location filter */}
        <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-lg shadow">
          <MapPin className="h-5 w-5 text-gray-400" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="flex-1 border rounded-md px-3 py-2"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => fetchPredictions()}
              className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Try Again
            </button>
          </div>
        ) : forecast ? (
          <>
            {forecast.source === 'cached' && (
              <div className="mb-4 text-sm text-gray-500 text-center">
                Using cached predictions from {new Date().toLocaleDateString()}
              </div>
            )}
            <WeeklyForecast
              weekStartDate={forecast.weekStartDate}
              predictions={forecast.predictions}
              peakHours={forecast.peakHours}
              lowDemandHours={forecast.lowDemandHours}
            />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700">
              No Predictions Available
            </h3>
            <p className="text-gray-500 mt-1">
              Predictions will be generated once enough booking data is collected.
            </p>
          </div>
        )}

        {/* Explanation */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            How Predictions Work
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              Our prediction system analyzes booking patterns from the past 4 weeks
              to forecast room demand for the upcoming week.
            </p>
            <p>
              <strong>Confidence level</strong> indicates how reliable the prediction is,
              based on the amount and consistency of historical data.
            </p>
            <p>
              Predictions are updated weekly and consider factors like day of week,
              time of day, and seasonal trends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
