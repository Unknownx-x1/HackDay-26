import React, { useState, useEffect } from 'react';
import { GitCompare } from 'lucide-react';
import type { AnalysisResult, SampleItem } from '../../types';
import { SpectrogramViewer } from '../SpectrogramViewer';

interface ComparatorViewProps {
  analysisResult: AnalysisResult | null;
  activeAudioUrl: string | null;
  activeAudioName: string;
  samples: SampleItem[];
}

export const ComparatorView: React.FC<ComparatorViewProps> = ({
  analysisResult,
  activeAudioUrl,
  activeAudioName,
  samples,
}) => {
  const [selectedRefId, setSelectedRefId] = useState<string>('human_casual_speech');
  const [refResult, setRefResult] = useState<AnalysisResult | null>(null);
  const [loadingRef, setLoadingRef] = useState<boolean>(false);

  useEffect(() => {
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

  if (!analysisResult) {
    return (
      <div className="brutal-card p-12 text-center flex flex-col items-center justify-center gap-3">
        <GitCompare className="w-8 h-8 text-[var(--text-muted)] animate-pulse" />
        <h3 className="text-sm font-mono font-bold uppercase text-[var(--text-primary)]">No Audio To Compare</h3>
        <p className="text-xs font-mono text-[var(--text-muted)] max-w-sm">
          Please select or record a target voice in the Acoustic Screener before opening the comparator view.
        </p>
      </div>
    );
  }

  const humanSamples = samples.filter((s) => s.type === 'human');

  const targetJitter = analysisResult.features.jitter_local_pct || 0.001;
  const refJitter = refResult?.features.jitter_local_pct || 1.15;
  const jitterRatio = (refJitter / Math.max(0.001, targetJitter)).toFixed(1);

  const targetShimmer = analysisResult.features.shimmer_local_pct || 0.001;
  const refShimmer = refResult?.features.shimmer_local_pct || 4.2;
  const shimmerRatio = (refShimmer / Math.max(0.001, targetShimmer)).toFixed(1);

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-black">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-black uppercase tracking-tight text-black mb-0.5">
            Side-by-Side Dual Comparator
          </h1>
          <p className="text-xs text-zinc-700 font-mono">
            Compare target audio directly against a verified biological human reference voice
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 bg-[#ebebe0] border-2 border-black text-black shadow-[2px_2px_0px_#000] flex items-center gap-1.5">
          <span>REFERENCE:</span>
          <strong className="bg-emerald-300 text-black px-1.5 py-0.5 border border-black font-black">{selectedRefId}</strong>
        </span>
      </div>

      {/* Delta Metrics KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="brutal-card p-4">
          <span className="text-[10px] font-mono uppercase font-bold text-zinc-600 block mb-1">
            Pitch Jitter Disparity
          </span>
          <div className="text-2xl font-black font-mono text-black">
            <span className="bg-yellow-300 px-1.5 py-0.5 border border-black">{jitterRatio}×</span> Regularity
          </div>
          <p className="text-[10px] font-mono text-zinc-700 mt-2 pt-2 border-t-2 border-black">
            Ratio of vocal cord cycle-to-cycle frequency perturbations.
          </p>
        </div>

        <div className="brutal-card p-4">
          <span className="text-[10px] font-mono uppercase font-bold text-zinc-600 block mb-1">
            Shimmer Flutter Ratio
          </span>
          <div className="text-2xl font-black font-mono text-black">
            <span className="bg-yellow-300 px-1.5 py-0.5 border border-black">{shimmerRatio}×</span> Flatness
          </div>
          <p className="text-[10px] font-mono text-zinc-700 mt-2 pt-2 border-t-2 border-black">
            Subglottal amplitude perturbation comparison.
          </p>
        </div>

        <div className="brutal-card p-4">
          <span className="text-[10px] font-mono uppercase font-bold text-zinc-600 block mb-1">
            Silence Floor Delta
          </span>
          <div className="text-2xl font-black font-mono text-black">
            <span className="bg-red-300 px-1.5 py-0.5 border border-black">{(analysisResult.features.silence_floor_db - (refResult?.features.silence_floor_db || -52)).toFixed(1)} dB</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-700 mt-2 pt-2 border-t-2 border-black">
            Algorithmic digital silence cuts vs natural room acoustics.
          </p>
        </div>
      </div>

      {/* Dual Spectrogram Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Target Clip */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold uppercase text-[var(--text-primary)] flex items-center gap-1.5">
              <span className="w-2 h-2 bg-rose-500"></span>
              TARGET: <strong className="text-[var(--text-primary)]">{activeAudioName}</strong>
            </span>
            <span className="text-[10px] font-mono font-black uppercase text-rose-500 border border-rose-500/40 px-2 py-0.5 bg-rose-500/10">
              {analysisResult.verdict} ({Math.round(analysisResult.ai_probability * 100)}% AI)
            </span>
          </div>

          <SpectrogramViewer
            spectrogram={analysisResult.spectrogram}
            audioUrl={activeAudioUrl}
            title="Target Clip Spectrogram"
          />
        </div>

        {/* Right: Biological Reference */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-[var(--text-primary)] flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500"></span>
                HUMAN REF:
              </span>
              <select
                value={selectedRefId}
                onChange={(e) => setSelectedRefId(e.target.value)}
                className="text-xs font-mono font-bold uppercase bg-[var(--surface-sub)] border border-[var(--surface-border)] px-2 py-0.5 text-emerald-500 cursor-pointer"
              >
                {humanSamples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[10px] font-mono font-black uppercase text-emerald-500 border border-emerald-500/40 px-2 py-0.5 bg-emerald-500/10">
              VERIFIED BIOLOGICAL
            </span>
          </div>

          {loadingRef || !refResult ? (
            <div className="h-64 brutal-card flex items-center justify-center text-[var(--text-muted)] font-mono text-xs font-bold uppercase">
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
    </div>
  );
};
