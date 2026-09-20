import React from 'react';
import { SpectrogramViewer } from '../SpectrogramViewer';
import { FeatureRadar } from '../FeatureRadar';
import type { AnalysisResult } from '../../types';
import { Activity, Layers, Sliders } from 'lucide-react';

interface SpectrogramViewProps {
  analysisResult: AnalysisResult | null;
  activeAudioUrl: string | null;
  activeAudioName: string;
}

export const SpectrogramView: React.FC<SpectrogramViewProps> = ({
  analysisResult,
  activeAudioUrl,
  activeAudioName,
}) => {
  if (!analysisResult) {
    return (
      <div className="brutal-card p-12 text-center flex flex-col items-center justify-center gap-3">
        <Activity className="w-8 h-8 text-[var(--text-muted)] animate-pulse" />
        <h3 className="text-sm font-mono font-bold uppercase text-[var(--text-primary)]">No Audio Selected</h3>
        <p className="text-xs font-mono text-[var(--text-muted)] max-w-sm">
          Please record audio or select a benchmark clip on the Acoustic Screener to generate time-frequency spectrogram data.
        </p>
      </div>
    );
  }

  const hfRatio = (analysisResult.features.hf_energy_ratio * 100).toFixed(1);
  const rolloff95 = Math.round(analysisResult.features.spectral_rolloff_95_hz || 6800);
  const flatness = (analysisResult.features.spectral_flatness || 0.015).toFixed(4);

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-black">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-black uppercase tracking-tight text-black mb-0.5">
            Spectrogram Laboratory
          </h1>
          <p className="text-xs text-zinc-700 font-mono">
            Interactive Short-Time Fourier Transform (STFT) matrix with automated vocoder shelf and pause gap detection
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 bg-[#ebebe0] border-2 border-black text-black shadow-[2px_2px_0px_#000] flex items-center gap-1.5">
          <span>SOURCE:</span>
          <span className="bg-yellow-300 text-black font-black px-1.5 py-0.5 border border-black">{activeAudioName}</span>
        </span>
      </div>

      {/* Primary Spectrogram & Fingerprint Radar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8">
          <SpectrogramViewer
            spectrogram={analysisResult.spectrogram}
            audioUrl={activeAudioUrl}
            title={`STFT Spectrogram Matrix (${activeAudioName})`}
          />
        </div>

        <div className="lg:col-span-4">
          <FeatureRadar
            radarData={analysisResult.explanations.radar_data}
            isAi={analysisResult.verdict === 'LIKELY_AI'}
          />
        </div>
      </div>

      {/* Spectral Texture & Bandwidth Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 brutal-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-[10px] uppercase font-bold text-zinc-600">Spectral Rolloff (95%)</span>
              <Layers className="w-4 h-4 text-black" />
            </div>
            <div className="text-2xl font-black font-mono text-black">
              {rolloff95} <span className="text-xs text-zinc-500 font-normal">Hz</span>
            </div>
          </div>
          <p className="text-[10px] font-mono text-zinc-700 mt-2 pt-2 border-t-2 border-black">
            Upper frequency boundary containing 95% of spectral energy. AI vocoders frequently exhibit steep shelf cutoffs &lt;6.2 kHz.
          </p>
        </div>

        <div className="p-4 brutal-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-[10px] uppercase font-bold text-zinc-600">High-Frequency Energy Ratio</span>
              <Activity className="w-4 h-4 text-black" />
            </div>
            <div className="text-2xl font-black font-mono text-black">
              {hfRatio}%
            </div>
          </div>
          <p className="text-[10px] font-mono text-zinc-700 mt-2 pt-2 border-t-2 border-black">
            Energy proportion above 6.5 kHz. Biological speech maintains rich, continuous harmonic decay across high octaves.
          </p>
        </div>

        <div className="p-4 brutal-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-[10px] uppercase font-bold text-zinc-600">Spectral Flatness (Tonality)</span>
              <Sliders className="w-4 h-4 text-black" />
            </div>
            <div className="text-2xl font-black font-mono text-black">
              {flatness}
            </div>
          </div>
          <p className="text-[10px] font-mono text-zinc-700 mt-2 pt-2 border-t-2 border-black">
            Measures harmonic peaks vs uniform white noise. Synthesized vocoders frequently synthesize unnaturally uniform spectral floors.
          </p>
        </div>
      </div>
    </div>
  );
};
