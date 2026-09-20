import React, { useState } from 'react';
import type { RadarItem } from '../types';
import { Radar } from 'lucide-react';

interface FeatureRadarProps {
  radarData: RadarItem[];
  isAi: boolean;
}

export const FeatureRadar: React.FC<FeatureRadarProps> = ({ radarData, isAi }) => {
  const [viewMode, setViewMode] = useState<'polar' | 'meters'>('polar');

  if (!radarData || radarData.length === 0) return null;

  // Geometry constants for Polar Radar
  const size = 330;
  const center = size / 2;
  const radius = size * 0.32;
  const numPoints = radarData.length;

  const getCoordinates = (index: number, value: number, customRadius?: number): [number, number] => {
    const rBase = customRadius !== undefined ? customRadius : (value / 100) * radius;
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const x = center + rBase * Math.cos(angle);
    const y = center + rBase * Math.sin(angle);
    return [x, y];
  };

  const getPolygonPoints = (key: 'sample_value' | 'human_baseline' | 'ai_baseline'): string => {
    return radarData
      .map((item, idx) => {
        const val = item[key];
        const [x, y] = getCoordinates(idx, val);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const samplePoints = getPolygonPoints('sample_value');
  const humanPoints = getPolygonPoints('human_baseline');
  const aiPoints = getPolygonPoints('ai_baseline');
  const levels = [25, 50, 75, 100];

  return (
    <div className="brutal-card p-4 sm:p-5 h-full flex flex-col justify-between text-left">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b-2 border-[var(--surface-border)] mb-2 gap-2">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-yellow-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Acoustic Fingerprint
          </h3>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-[var(--surface-sub)] border border-[var(--surface-border)] p-0.5">
          <button
            onClick={() => setViewMode('polar')}
            className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold transition cursor-pointer ${
              viewMode === 'polar'
                ? 'bg-yellow-400 text-black shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Polar
          </button>
          <button
            onClick={() => setViewMode('meters')}
            className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold transition cursor-pointer ${
              viewMode === 'meters'
                ? 'bg-yellow-400 text-black shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Channels
          </button>
        </div>
      </div>

      {/* VIEW 1: Polar Radar */}
      {viewMode === 'polar' ? (
        <div className="flex flex-col items-center justify-center my-auto">
          {/* Legend */}
          <div className="flex items-center justify-center gap-3 text-[9px] font-mono mb-1">
            <span className="flex items-center gap-1 font-bold text-emerald-500">
              <span className="w-2 h-2 border border-emerald-500 bg-emerald-500/20"></span> Biological (20%)
            </span>
            <span className="flex items-center gap-1 font-bold text-rose-500">
              <span className="w-2 h-2 border border-rose-500 bg-rose-500/20"></span> Synthetic (85%)
            </span>
            <span className="flex items-center gap-1 font-bold text-yellow-400">
              <span className="w-2 h-2 bg-yellow-400"></span> Sample Value
            </span>
          </div>

          <div className="relative w-full max-w-[340px] h-[280px] flex items-center justify-center overflow-visible">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
              {/* Concentric grid webs */}
              {levels.map((lvl) => {
                const levelPoints = Array.from({ length: numPoints })
                  .map((_, i) => {
                    const [x, y] = getCoordinates(i, lvl);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ');
                return (
                  <g key={lvl}>
                    <polygon
                      points={levelPoints}
                      fill="none"
                      stroke="var(--surface-border)"
                      strokeWidth="1"
                    />
                    <text
                      x={center + 3}
                      y={center - (lvl / 100) * radius + 3}
                      fill="var(--text-muted)"
                      fontSize="7.5"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      {lvl}%
                    </text>
                  </g>
                );
              })}

              {/* Radial Axis Spokes */}
              {radarData.map((_, idx) => {
                const [x, y] = getCoordinates(idx, 100);
                return (
                  <line
                    key={idx}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="var(--surface-border)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Human Baseline Polygon */}
              <polygon
                points={humanPoints}
                fill="rgba(34, 197, 94, 0.08)"
                stroke="#22c55e"
                strokeWidth="1.5"
                strokeDasharray="3,2"
              />

              {/* AI Baseline Polygon */}
              <polygon
                points={aiPoints}
                fill="rgba(239, 68, 68, 0.08)"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="3,2"
              />

              {/* Sample Polygon */}
              <polygon
                points={samplePoints}
                fill={isAi ? 'rgba(239, 68, 68, 0.25)' : 'rgba(250, 204, 21, 0.25)'}
                stroke={isAi ? '#ef4444' : '#facc15'}
                strokeWidth="2.5"
                className="transition-all duration-500 ease-out"
              />

              {/* Sample Coordinate Dots */}
              {radarData.map((item, idx) => {
                const [x, y] = getCoordinates(idx, item.sample_value);
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={isAi ? '#ef4444' : '#facc15'}
                    stroke="var(--canvas-bg)"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Unclipped Axis Labels with quadrant-aware text anchor */}
              {radarData.map((item, idx) => {
                const angle = (Math.PI * 2 * idx) / numPoints - Math.PI / 2;
                const labelDist = radius + 22;
                const lx = center + labelDist * Math.cos(angle);
                const ly = center + labelDist * Math.sin(angle);

                const cos = Math.cos(angle);
                const textAnchor = cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle';
                const labelText = item.code || item.metric.slice(0, 7).toUpperCase();

                return (
                  <g key={idx}>
                    <text
                      x={lx}
                      y={ly}
                      fill="var(--text-primary)"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                      textAnchor={textAnchor}
                    >
                      {labelText}
                    </text>
                    <text
                      x={lx}
                      y={ly + 9}
                      fill={item.sample_value >= 60 ? '#ef4444' : '#22c55e'}
                      fontSize="7.5"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                      textAnchor={textAnchor}
                    >
                      {item.sample_value.toFixed(0)}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* VIEW 2: Metric Channels (100% Unclipped, Horizontal Segmented Gauges) */
        <div className="flex flex-col gap-2 py-1 overflow-y-auto max-h-[300px] pr-1">
          {radarData.map((item, idx) => {
            const isAnomaly = item.sample_value >= 60;
            const pct = Math.min(100, Math.max(0, item.sample_value));

            return (
              <div key={idx} className="p-1.5 bg-[var(--surface-sub)] border border-[var(--surface-border)] flex flex-col gap-1 text-[10px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-primary)] truncate">
                    {item.code || item.metric}: <span className="text-[var(--text-secondary)] font-normal">{item.full_name || item.metric}</span>
                  </span>
                  <span className={`font-bold uppercase px-1 border ${
                    isAnomaly
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                  }`}>
                    {isAnomaly ? 'ARTIFACT' : 'NATURAL'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Segmented bar */}
                  <div className="flex-1 h-3 bg-[var(--canvas-bg)] border border-[var(--surface-border)] overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isAnomaly ? 'bg-rose-500' : 'bg-yellow-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-bold text-[var(--text-primary)] w-10 text-right">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 border-t border-[var(--surface-border)] text-[9px] font-mono text-[var(--text-muted)] flex items-center justify-between">
        <span>Scale: 0 = Biological Human, 100 = Synthetic</span>
        <span className="font-bold text-[var(--text-primary)]">9 Acoustic Dimensions</span>
      </div>
    </div>
  );
};
