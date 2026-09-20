import React, { useState } from 'react';
import { X, SplitSquareVertical } from 'lucide-react';
import type { AnalysisResult, SampleItem } from '../types';
import { SpectrogramViewer } from './SpectrogramViewer';

interface SpectrogramDiffProps {
  onClose: () => void;
  targetResult: AnalysisResult;
  targetAudioUrl?: string | null;
  samples: SampleItem[];
}

export const SpectrogramDiff: React.FC<SpectrogramDiffProps> = ({
  onClose,
  targetResult,
  targetAudioUrl,
  samples,
}) => {
  const [selectedRefId, setSelectedRefId] = useState<string>('human_casual_speech');
  const [refResult, setRefResult] = useState<AnalysisResult | null>(null);
  const [loadingRef, setLoadingRef] = useState<boolean>(false);

  React.useEffect(() => {
    fetchReference(selectedRefId);
  }, [selectedRefId]);

  const fetchReference = async (refId: string) => {
    setLoadingRef(true);
    try {
      const formData = new FormData();
      formData.append('sample_id', refId);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.status === 'success') {
        setRefResult(data.result);
      }
    } catch (err) {
      console.error('Failed to load reference clip:', err);
    } finally {
      setLoadingRef(false);
    }
  };

  const humanSamples = samples.filter((s) => s.type === 'human');

  const targetJitter = targetResult.features.jitter_local_pct || 0.001;
  const refJitter = refResult?.features.jitter_local_pct || 1.15;
  const jitterRatio = (refJitter / Math.max(0.001, targetJitter)).toFixed(1);

  const targetShimmer = targetResult.features.shimmer_local_pct || 0.001;
  const refShimmer = refResult?.features.shimmer_local_pct || 4.2;
  const shimmerRatio = (refShimmer / Math.max(0.001, targetShimmer)).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-[#05070c]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="surface-card w-full max-w-5xl p-6 flex flex-col gap-4 shadow-2xl border-[#22293d] relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1c2132]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <SplitSquareVertical className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Side-by-Side Spectrogram & Delta Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Direct comparative screening against biological human reference voice
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151926] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Delta Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#07090e] border border-[#1a1f2e] text-left">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">Pitch Jitter Disparity</span>
            <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
              {jitterRatio}× Regularity
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Target micro-tremor is smoothed compared to reference voice.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#07090e] border border-[#1a1f2e] text-left">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">Shimmer Flutter Ratio</span>
            <div className="text-base font-bold font-mono text-indigo-400 mt-0.5">
              {shimmerRatio}× Flatness
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Subglottal amplitude perturbation is suppressed in target audio.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#07090e] border border-[#1a1f2e] text-left">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">Silence Floor Delta</span>
            <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
              {(targetResult.features.silence_floor_db - (refResult?.features.silence_floor_db || -48)).toFixed(1)} dB
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Digital zero silence cuts vs natural room reverberation decay.
            </p>
          </div>
        </div>

        {/* Dual Spectrograms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Analyzed Target Clip
              </span>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                {targetResult.verdict} ({Math.round(targetResult.ai_probability * 100)}% AI)
              </span>
            </div>
            <SpectrogramViewer
              spectrogram={targetResult.spectrogram}
              audioUrl={targetAudioUrl}
              title="Target Clip Spectrogram"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Reference Voice:
                </span>
                <select
                  value={selectedRefId}
                  onChange={(e) => setSelectedRefId(e.target.value)}
                  className="text-xs font-mono bg-[#07090e] border border-[#222a3f] rounded px-2 py-0.5 text-emerald-400 cursor-pointer"
                >
                  {humanSamples.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Verified Human
              </span>
            </div>

            {loadingRef || !refResult ? (
              <div className="h-44 sm:h-52 rounded-lg bg-[#07090e] border border-[#1a1f2e] flex items-center justify-center text-slate-500 font-mono text-xs">
                Loading reference spectrogram...
              </div>
            ) : (
              <SpectrogramViewer
                spectrogram={refResult.spectrogram}
                audioUrl={`/api/sample/${selectedRefId}/audio`}
                title="Biological Human Reference"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#1c2132]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#151926] hover:bg-[#1f2538] border border-[#22293d] text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            Close Diff View
          </button>
        </div>
      </div>
    </div>
  );
};
