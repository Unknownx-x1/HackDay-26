import React from 'react';
import type { ForensicFinding } from '../types';
import { BookOpen, ShieldCheck } from 'lucide-react';

interface ExplanationsDrawerProps {
  findings: ForensicFinding[];
  isAi?: boolean;
}

export const ExplanationsDrawer: React.FC<ExplanationsDrawerProps> = ({ findings, isAi }) => {
  return (
    <div className="brutal-card p-4 sm:p-5 h-full flex flex-col justify-between text-left">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b-2 border-black mb-3 gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-black" />
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-black">
              {isAi ? 'Diagnostic Anomaly Audit (Synthetic Artifacts Flagged)' : 'Biological Verification Proofs (Authentic Human Signals)'}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-600 font-bold">
            Acoustic Signal Physics
          </span>
        </div>

        <p className="text-xs font-mono text-zinc-700 mb-4 text-left">
          {isAi
            ? 'Deterministic physical anomalies isolating neural vocoder synthesis from biological vocal cords:'
            : 'Verified physical vocal cord markers establishing authentic biological human speech:'}
        </p>
      </div>

      {/* Forensic Findings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {findings.map((finding, idx) => {
          const isArtifact = finding.badge === 'Synthetic Artifact';

          return (
            <div
              key={idx}
              className={`p-3.5 border-2 border-black text-left flex flex-col justify-between transition-all ${
                isArtifact
                  ? 'bg-[#fff5f5] shadow-[4px_4px_0px_#000]'
                  : 'bg-[#f0fdf4] shadow-[4px_4px_0px_#000]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[9px] font-mono font-black px-2 py-0.5 uppercase border-2 border-black shadow-[1px_1px_0px_#000] ${
                      isArtifact
                        ? 'bg-red-300 text-black'
                        : 'bg-emerald-300 text-black'
                    }`}
                  >
                    {finding.badge}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-600">
                    FINDING #{idx + 1}
                  </span>
                </div>

                <h4 className="text-xs font-mono font-black uppercase tracking-tight text-black mb-1.5">
                  {finding.title}
                </h4>

                <p className="text-xs font-mono text-zinc-700 leading-relaxed mb-3">
                  {finding.description}
                </p>
              </div>

              <div className={`pt-2 border-t-2 border-black text-[10px] font-mono font-black ${
                isArtifact ? 'text-red-700' : 'text-emerald-800'
              }`}>
                {finding.evidence}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scientific Defense Box */}
      <div className="p-4 bg-[#ebebe0] border-2 border-black shadow-[3px_3px_0px_#000] text-left flex items-start gap-3">
        <div className="p-2 bg-yellow-300 text-black border-2 border-black shadow-[1px_1px_0px_#000] shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-mono font-black uppercase tracking-tight text-black mb-1">
            Acoustic Signal Physics: Laryngeal Perturbations vs. Black-Box Neural Classifiers
          </h4>
          <p className="text-xs font-mono text-zinc-800 leading-relaxed">
            Biological human vocal production exhibits physiological entropy: laryngeal fold inertia, cycle-to-cycle frequency perturbations (jitter), amplitude flutter (shimmer), and subglottal aspiration turbulence. Generative neural vocoders synthesize mathematically regular waveforms that lack these involuntary micro-irregularities. Voiceprint measures these deterministic physical differences directly.
          </p>
        </div>
      </div>
    </div>
  );
};
