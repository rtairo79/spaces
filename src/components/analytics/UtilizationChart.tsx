'use client';

import { useMemo } from 'react';

interface DataPoint {
  label: string;
  value: number;
  secondary?: number;
}

interface UtilizationChartProps {
  data: DataPoint[];
  title?: string;
  valueLabel?: string;
  secondaryLabel?: string;
  height?: number;
}

export function UtilizationChart({
  data,
  title,
  valueLabel = 'Primary',
  secondaryLabel,
  height = 200,
}: UtilizationChartProps) {
  const maxValue = useMemo(() => {
    const allValues = data.flatMap((d) => [d.value, d.secondary || 0]);
    return Math.max(...allValues, 1);
  }, [data]);

  const chartWidth = 600;
  const chartHeight = height;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const xStep = graphWidth / (data.length - 1 || 1);

  const getY = (value: number) => {
    return graphHeight - (value / maxValue) * graphHeight;
  };

  // Generate path for primary line
  const primaryPath = data
    .map((d, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + getY(d.value);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate path for secondary line if exists
  const secondaryPath = data.some((d) => d.secondary !== undefined)
    ? data
        .map((d, i) => {
          const x = padding.left + i * xStep;
          const y = padding.top + getY(d.secondary || 0);
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ')
    : null;

  // Generate area fill path
  const areaPath = `${primaryPath} L ${padding.left + (data.length - 1) * xStep} ${
    padding.top + graphHeight
  } L ${padding.left} ${padding.top + graphHeight} Z`;

  // Y-axis ticks
  const yTicks = [0, 25, 50, 75, 100].filter((t) => t <= maxValue);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        style={{ maxHeight: chartHeight }}
      >
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={tick}
            x1={padding.left}
            y1={padding.top + getY(tick)}
            x2={chartWidth - padding.right}
            y2={padding.top + getY(tick)}
            stroke="#e5e7eb"
            strokeDasharray="4,4"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <text
            key={tick}
            x={padding.left - 10}
            y={padding.top + getY(tick) + 4}
            textAnchor="end"
            className="text-xs fill-gray-500"
          >
            {tick}%
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#gradient)" opacity="0.2" />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Primary line */}
        <path
          d={primaryPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Secondary line */}
        {secondaryPath && (
          <path
            d={secondaryPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4,4"
          />
        )}

        {/* Data points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={padding.left + i * xStep}
              cy={padding.top + getY(d.value)}
              r="4"
              fill="#3b82f6"
            />
            {d.secondary !== undefined && (
              <circle
                cx={padding.left + i * xStep}
                cy={padding.top + getY(d.secondary)}
                r="4"
                fill="#10b981"
              />
            )}
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={padding.left + i * xStep}
            y={chartHeight - 10}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {d.label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600">{valueLabel}</span>
        </div>
        {secondaryLabel && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">{secondaryLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
