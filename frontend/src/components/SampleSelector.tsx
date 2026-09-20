import React, { useState, useRef } from 'react';
import { User, Bot, Play, Pause, Radio, Volume2 } from 'lucide-react';
import type { SampleItem } from '../types';

interface SampleSelectorProps {
  samples: SampleItem[];
  selectedSampleId: string | null;
  onSelectSample: (sampleId: string) => void;
  isLoading: boolean;
}

export const SampleSelector: React.FC<SampleSelectorProps> = ({
  samples,
  selectedSampleId,
  onSelectSample,
  isLoading,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [corpusFilter, setCorpusFilter] = useState<'all' | 'human' | 'ai'>('all');

  const toggleListen = (e: React.MouseEvent, sampleId: string) => {
    e.stopPropagation();

    if (playingId === sampleId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(`/api/sample/${sampleId}/audio`);
    audioRef.current = audio;
    setPlayingId(sampleId);

    audio.play().catch((err) => console.error("Audio playback error:", err));
    audio.onended = () => {
      setPlayingId(null);
    };
  };

  const filteredSamples = samples.filter((s) => {
    if (corpusFilter === 'all') return true;
    return s.type === corpusFilter;
  });

  return (
    <div className="brutal-card p-4 sm:p-5 h-full flex flex-col justify-between text-left">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between pb-3 border-b-2 border-[var(--surface-border)] mb-3 gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-yellow-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Calibration Audio Corpus
            </h3>
          </div>

          <div className="flex items-center gap-1.5 bg-[#ebebe0] border-2 border-black p-1 shadow-[2px_2px_0px_#000]">
            <button
              onClick={() => setCorpusFilter('all')}
              className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                corpusFilter === 'all'
                  ? 'bg-yellow-300 text-black border-2 border-black font-black shadow-[1px_1px_0px_#000]'
                  : 'border-2 border-transparent text-zinc-600 hover:text-black'
              }`}
            >
              ALL ({samples.length})
            </button>
            <button
              onClick={() => setCorpusFilter('human')}
              className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                corpusFilter === 'human'
                  ? 'bg-emerald-300 text-black border-2 border-black font-black shadow-[1px_1px_0px_#000]'
                  : 'border-2 border-transparent text-zinc-600 hover:text-black'
              }`}
            >
              HUMAN
            </button>
            <button
              onClick={() => setCorpusFilter('ai')}
              className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                corpusFilter === 'ai'
                  ? 'bg-red-300 text-black border-2 border-black font-black shadow-[1px_1px_0px_#000]'
                  : 'border-2 border-transparent text-zinc-600 hover:text-black'
              }`}
            >
              SYNTHETIC
            </button>
          </div>
        </div>

        <p className="text-[11px] font-mono text-zinc-700 mb-3 text-left">
          Select a verified reference profile to inspect spectral features or test forensic classification:
        </p>
      </div>

      {/* Grid of brutalist sample cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSamples.map((sample) => {
          const isSelected = selectedSampleId === sample.id;
          const isHuman = sample.type === 'human';
          const isPlayingThis = playingId === sample.id;

          return (
            <div
              key={sample.id}
              onClick={() => !isLoading && onSelectSample(sample.id)}
              className={`p-3 border-2 border-black text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
                isSelected
                  ? isHuman
                    ? 'bg-[#ecfdf5] shadow-[5px_5px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-[#fef2f2] shadow-[5px_5px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-white shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5'
              } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div>
                {/* Top Type Badge */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-mono font-black uppercase px-1.5 py-0.5 border-2 border-black shadow-[1px_1px_0px_#000] ${
                      isHuman
                        ? 'bg-emerald-300 text-black'
                        : 'bg-red-300 text-black'
                    }`}
                  >
                    {isHuman ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    <span>{isHuman ? 'Biological' : 'Synthetic'}</span>
                  </span>

                  <span className="text-[9px] font-mono font-bold text-zinc-600 truncate max-w-[90px]">
                    {sample.speaker}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-xs font-mono font-black uppercase tracking-tight text-black line-clamp-1 mb-1">
                  {sample.title}
                </h4>

                {/* Description */}
                <p className="text-[10px] font-mono text-zinc-700 leading-tight line-clamp-2 mb-2">
                  {sample.description}
                </p>
              </div>

              {/* Bottom bar with Listen & Screen controls */}
              <div className="pt-2 border-t-2 border-black flex items-center justify-between text-[10px] font-mono">
                {/* Listen button */}
                <button
                  type="button"
                  onClick={(e) => toggleListen(e, sample.id)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-black font-black uppercase transition cursor-pointer ${
                    isPlayingThis
                      ? 'bg-yellow-300 text-black shadow-[2px_2px_0px_#000]'
                      : 'bg-white text-black hover:bg-yellow-300 shadow-[1px_1px_0px_#000]'
                  }`}
                  title="Audition audio clip directly"
                >
                  {isPlayingThis ? (
                    <>
                      <Pause className="w-2.5 h-2.5 fill-current" />
                      <span>STOP</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-2.5 h-2.5" />
                      <span>LISTEN</span>
                    </>
                  )}
                </button>

                {/* Screen badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-black text-[9px] font-mono font-black uppercase shadow-[1px_1px_0px_#000] ${
                    isSelected
                      ? isHuman
                        ? 'bg-emerald-300 text-black'
                        : 'bg-red-300 text-black'
                      : 'bg-[#ebebe0] text-zinc-700'
                  }`}
                >
                  <Play className="w-2 h-2 fill-current" />
                  {isSelected ? 'LOADED' : 'ANALYZE'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
