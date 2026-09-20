import React from 'react';
import type { AnalysisResult } from '../../types';
import { BarChart3, Sliders, Cpu } from 'lucide-react';

interface StatisticsViewProps {
  analysisResult: AnalysisResult | null;
  activeAudioName: string;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  analysisResult,
  activeAudioName,
}) => {
  if (!analysisResult) {
    return (
      <div className="brutal-card p-12 text-center flex flex-col items-center justify-center gap-3">
        <BarChart3 className="w-8 h-8 text-[var(--text-muted)] animate-pulse" />
        <h3 className="text-sm font-mono font-bold uppercase text-[var(--text-primary)]">No Statistics Available</h3>
        <p className="text-xs font-mono text-[var(--text-muted)] max-w-sm">
          Screen an audio recording from the Acoustic Screener to view its complete acoustic parameter matrix and distribution deviations.
        </p>
      </div>
    );
  }

  const f = analysisResult.features;

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-black">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-black uppercase tracking-tight text-black mb-0.5">
            Forensic Acoustic Statistics
          </h1>
          <p className="text-xs text-zinc-700 font-mono">
            Quantitative parameter measurements evaluated against clinical voice science baselines
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 bg-[#ebebe0] border-2 border-black text-black shadow-[2px_2px_0px_#000] flex items-center gap-1.5">
          <span>SOURCE:</span>
          <span className="bg-yellow-300 text-black font-black px-1.5 py-0.5 border border-black">{activeAudioName}</span>
        </span>
      </div>

      {/* Top 4 KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Jitter KPI */}
        <div className="brutal-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-zinc-600 mb-1">
            <span>Pitch Jitter (Local)</span>
            <span className={`px-1.5 py-0.5 border-2 border-black text-[9px] font-black shadow-[1px_1px_0px_#000] ${
              f.jitter_local_pct < 0.5 ? 'bg-red-300 text-black' : 'bg-emerald-300 text-black'
            }`}>
              {f.jitter_local_pct < 0.5 ? 'SUPPRESSED' : 'NATURAL'}
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-black">
            {typeof f.jitter_local_pct === 'number' ? f.jitter_local_pct.toFixed(2) : f.jitter_local_pct}
            <span className="text-xs text-zinc-500 font-normal ml-0.5">%</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-600 mt-2 pt-2 border-t-2 border-black">
            Human baseline: <span className="font-black text-black">0.50% – 1.80%</span>
          </div>
        </div>

        {/* Shimmer KPI */}
        <div className="brutal-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-zinc-600 mb-1">
            <span>Amplitude Shimmer</span>
            <span className={`px-1.5 py-0.5 border-2 border-black text-[9px] font-black shadow-[1px_1px_0px_#000] ${
              f.shimmer_local_pct < 2.0 ? 'bg-red-300 text-black' : 'bg-emerald-300 text-black'
            }`}>
              {f.shimmer_local_pct < 2.0 ? 'SUPPRESSED' : 'NATURAL'}
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-black">
            {typeof f.shimmer_local_pct === 'number' ? f.shimmer_local_pct.toFixed(2) : f.shimmer_local_pct}
            <span className="text-xs text-zinc-500 font-normal ml-0.5">%</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-600 mt-2 pt-2 border-t-2 border-black">
            Human baseline: <span className="font-black text-black">2.20% – 6.50%</span>
          </div>
        </div>

        {/* HNR KPI */}
        <div className="brutal-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-zinc-600 mb-1">
            <span>Harmonics-to-Noise</span>
            <span className={`px-1.5 py-0.5 border-2 border-black text-[9px] font-black shadow-[1px_1px_0px_#000] ${
              f.hnr_mean_db > 22.0 ? 'bg-red-300 text-black' : 'bg-emerald-300 text-black'
            }`}>
              {f.hnr_mean_db > 22.0 ? 'STERILE' : 'NATURAL'}
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-black">
            {typeof f.hnr_mean_db === 'number' ? f.hnr_mean_db.toFixed(1) : f.hnr_mean_db}
            <span className="text-xs text-zinc-500 font-normal ml-0.5">dB</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-600 mt-2 pt-2 border-t-2 border-black">
            Human baseline: <span className="font-black text-black">11.0 – 21.0 dB</span>
          </div>
        </div>

        {/* Silence Floor KPI */}
        <div className="brutal-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-zinc-600 mb-1">
            <span>Pause Silence Floor</span>
            <span className={`px-1.5 py-0.5 border-2 border-black text-[9px] font-black shadow-[1px_1px_0px_#000] ${
              f.silence_floor_db < -80.0 ? 'bg-red-300 text-black' : 'bg-emerald-300 text-black'
            }`}>
              {f.silence_floor_db < -80.0 ? 'DIGITAL ZERO' : 'ROOM AMBIENT'}
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-black">
            {typeof f.silence_floor_db === 'number' ? f.silence_floor_db.toFixed(1) : f.silence_floor_db}
            <span className="text-xs text-zinc-500 font-normal ml-0.5">dB</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-600 mt-2 pt-2 border-t-2 border-black">
            Room ambient decay: <span className="font-black text-black">&gt; -75.0 dB</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Acoustic Parameter Breakdown Table */}
      <div className="brutal-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b-2 border-black mb-3 gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-black" />
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-black">
              Full Acoustic Extraction Matrix vs Clinical Bounds
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-600 font-bold">
            Praat PointProcess & Librosa STFT Engine
          </span>
        </div>

        <div className="overflow-x-auto border-2 border-black">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b-2 border-black bg-[#ebebe0] text-black text-[10px] uppercase font-black">
                <th className="py-2.5 px-3">Acoustic Signal Parameter</th>
                <th className="py-2.5 px-3 text-right">Measured</th>
                <th className="py-2.5 px-3 text-center">Biological Human Normal</th>
                <th className="py-2.5 px-3 text-center">AI Vocoder Typical</th>
                <th className="py-2.5 px-3 text-right">Forensic Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {analysisResult.explanations.metrics_table.map((m) => {
                const isAnom = m.status === 'anomalous';
                return (
                  <tr key={m.key} className="hover:bg-yellow-50/80 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-black text-black">{m.name}</div>
                      <div className="text-[10px] text-zinc-600 max-w-sm leading-snug mt-0.5">
                        {m.description}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-black text-sm text-black">
                      {typeof m.value === 'number' ? m.value.toFixed(2) : m.value}
                      <span className="text-zinc-500 text-[10px] ml-0.5">{m.unit}</span>
                    </td>

                    <td className="py-2.5 px-3 text-center text-zinc-700 text-[11px] font-bold">
                      {m.human_range}
                    </td>

                    <td className="py-2.5 px-3 text-center text-zinc-600 text-[11px]">
                      {m.ai_typical}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {isAnom ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase bg-red-300 text-black border-2 border-black shadow-[1px_1px_0px_#000]">
                          SYNTHETIC ARTIFACT
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-300 text-black border-2 border-black shadow-[1px_1px_0px_#000]">
                          NATURAL SIGNAL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture Telemetry Footer */}
      <div className="p-4 brutal-card flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-700">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-black" />
          <span>Classifier: <strong className="text-black font-black">Logistic Regression + Platt Calibration</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span>Dimensions: <strong className="text-black font-black">15 Acoustic Features</strong></span>
          <span>GPU Dependency: <strong className="bg-emerald-300 text-black px-1.5 py-0.5 border border-black font-black">Zero (Pure DSP)</strong></span>
          <span>Latency: <strong className="bg-yellow-300 text-black px-1.5 py-0.5 border border-black font-black">&lt;18ms</strong></span>
        </div>
      </div>
    </div>
  );
};
