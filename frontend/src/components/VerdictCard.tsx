import React from 'react';
import { ShieldAlert, ShieldCheck, HelpCircle } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface VerdictCardProps {
  result: AnalysisResult;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ result }) => {
  const isAi = result.verdict === 'LIKELY_AI';
  const isHuman = result.verdict === 'LIKELY_HUMAN';
  const scorePercent = Math.round(isAi ? result.ai_probability * 100 : result.human_probability * 100);

  // 12-segment brutalist LED bar calculation
  const totalSegments = 12;
  const activeSegments = Math.round((scorePercent / 100) * totalSegments);

  return (
    <div
      className={`brutal-card p-5 sm:p-7 text-left border-2 border-black shadow-[5px_5px_0px_#000] ${
        isAi
          ? 'bg-[#fff5f5] border-l-8 border-l-red-500'
          : isHuman
          ? 'bg-[#f0fdf4] border-l-8 border-l-emerald-500'
          : 'bg-[#fffbeb] border-l-8 border-l-amber-500'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Column: Verdict, Details & Evidence Badges */}
        <div className="flex-1 min-w-0">
          {/* Top Status Stamp Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-black tracking-wider uppercase border-2 border-black shadow-[2px_2px_0px_#000] ${
                isAi
                  ? 'bg-red-300 text-black'
                  : isHuman
                  ? 'bg-emerald-300 text-black'
                  : 'bg-amber-300 text-black'
              }`}
            >
              {isAi ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-black" />
                  <span>SYNTHETIC SPEECH (AI GENERATED)</span>
                </>
              ) : isHuman ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>AUTHENTIC HUMAN VOICE</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4 text-black" />
                  <span>BORDERLINE CLASSIFICATION</span>
                </>
              )}
            </span>

            <span className="text-[10px] font-mono font-bold text-zinc-700 px-2 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000]">
              RISK: <span className="text-black font-black">{result.risk_level.replace(/_/g, ' ')}</span>
            </span>

            <span className="text-[10px] font-mono font-bold text-zinc-700 px-2 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center gap-1.5">
              <span>CONFIDENCE:</span>
              <span className="bg-yellow-300 text-black font-black px-1.5 py-0.2 border border-black">{result.confidence_score}%</span>
            </span>
          </div>

          {/* Headline Title */}
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-black mb-2 font-mono uppercase">
            {isAi && "Artificial Vocoder Fingerprints Flagged"}
            {isHuman && "Biological Vocal Micro-Dynamics Verified"}
            {!isAi && !isHuman && "Inconclusive Acoustic Signature"}
          </h2>

          {/* Diagnostic Prose */}
          <p className="text-xs sm:text-sm text-zinc-800 font-mono leading-relaxed max-w-2xl mb-4">
            {result.explanations.headline}
          </p>

          {/* Key Tells Badges Grid */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-black uppercase text-zinc-600 shrink-0">
              KEY SIGNALS:
            </span>
            {result.explanations.findings.map((finding, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000] ${
                  finding.badge === 'Synthetic Artifact'
                    ? 'bg-red-200 text-black'
                    : 'bg-emerald-200 text-black'
                }`}
              >
                <span>{finding.title}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right Column: Neobrutalist Readout Box */}
        <div className="shrink-0 w-full lg:w-56 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-600 mb-1">
            {isAi ? 'AI Probability' : 'Human Fidelity'}
          </span>

          <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tighter ${
            isAi ? 'text-red-600' : 'text-emerald-700'
          }`}>
            {scorePercent}%
          </div>

          {/* 12-Segment Brutalist LED Meter */}
          <div className="w-full flex items-center justify-between gap-1 my-2.5 px-1">
            {Array.from({ length: totalSegments }).map((_, i) => {
              const isFilled = i < activeSegments;
              return (
                <div
                  key={i}
                  className={`h-4 flex-1 border-2 border-black ${
                    isFilled
                      ? isAi
                        ? 'bg-red-500'
                        : 'bg-emerald-400'
                      : 'bg-[#ebebe0]'
                  }`}
                />
              );
            })}
          </div>

          <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 border-2 border-black shadow-[1px_1px_0px_#000] ${
            isAi
              ? 'bg-red-300 text-black'
              : 'bg-emerald-300 text-black'
          }`}>
            {isAi ? 'FLAGGED: SYNTHETIC' : 'VERIFIED: BIOLOGICAL'}
          </span>
        </div>
      </div>
    </div>
  );
};
