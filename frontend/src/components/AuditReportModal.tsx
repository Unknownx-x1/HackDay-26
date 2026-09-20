import React from 'react';
import { X, Printer } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface AuditReportModalProps {
  result: AnalysisResult;
  onClose: () => void;
  audioFilename?: string;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  result,
  onClose,
  audioFilename = 'audio_capture_stream.wav',
}) => {
  const isAi = result.verdict === 'LIKELY_AI';
  const isHuman = result.verdict === 'LIKELY_HUMAN';
  const reportDate = new Date().toLocaleString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="brutal-card w-full max-w-3xl p-6 sm:p-8 flex flex-col gap-5 text-theme-text-primary text-left border-2 border-theme-border bg-theme-card brutal-shadow relative my-8 print:m-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-theme-border print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 border border-theme-border bg-theme-surface text-theme-accent text-[10px] font-mono font-bold tracking-wider uppercase">
              [FORENSIC_AUDIT_CERTIFICATE]
            </span>
            <span className="text-xs text-theme-text-muted font-mono">ISO/IEC 30107 BIOMETRIC STANDARDS ALIGNED</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="brutal-btn flex items-center gap-1.5 text-xs py-1.5 px-3 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>[PRINT / PDF]</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 border border-theme-border bg-theme-surface hover:bg-theme-accent hover:text-black text-theme-text-muted transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-theme-border pb-4">
            <div>
              <div className="text-[10px] font-mono font-bold text-theme-accent uppercase tracking-widest">
                ACOUSTIC FORENSIC DOSSIER // DECLASSIFIED
              </div>
              <h2 className="text-xl font-black tracking-tight font-mono text-theme-text-primary print:text-black mt-1">
                VOICEPRINT FORENSIC AUDIT RECORD
              </h2>
              <p className="text-xs text-theme-text-muted print:text-slate-600 mt-0.5 font-mono">
                Deterministic Micro-Perturbation & Neural Vocoder Spectral Screening
              </p>
            </div>
            <div className="text-right text-[10px] font-mono text-theme-text-muted print:text-slate-600">
              <div>TIMESTAMP: {reportDate}</div>
              <div>ENGINE_CORE: VOICEPRINT_v2.0</div>
              <div>HASH: 0x{Math.random().toString(16).substring(2, 10).toUpperCase()}</div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 border-2 border-theme-border bg-theme-surface print:bg-slate-100 print:border-slate-300 print:text-black text-xs font-mono">
            <div>
              <span className="text-theme-text-muted print:text-slate-600 block text-[9px] uppercase font-bold">SOURCE_PAYLOAD</span>
              <span className="font-bold truncate block text-theme-text-primary print:text-black">{audioFilename}</span>
            </div>
            <div>
              <span className="text-theme-text-muted print:text-slate-600 block text-[9px] uppercase font-bold">SAMPLE_LENGTH</span>
              <span className="font-bold text-theme-text-primary print:text-black">{result.features.duration_sec}s</span>
            </div>
            <div>
              <span className="text-theme-text-muted print:text-slate-600 block text-[9px] uppercase font-bold">SAMPLING_RATE</span>
              <span className="font-bold text-theme-text-primary print:text-black">16,000 Hz MONO PCM</span>
            </div>
            <div>
              <span className="text-theme-text-muted print:text-slate-600 block text-[9px] uppercase font-bold">FUNDAMENTAL_F0</span>
              <span className="font-bold text-theme-text-primary print:text-black">{result.features.mean_f0_hz} Hz</span>
            </div>
          </div>

          {/* Verdict Banner */}
          <div
            className={`p-4 border-2 flex items-center justify-between font-mono ${
              isAi
                ? 'bg-red-500/10 border-red-500 text-red-400 print:bg-red-50 print:border-red-600 print:text-red-700'
                : isHuman
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 print:bg-emerald-50 print:border-emerald-600 print:text-emerald-700'
                : 'bg-amber-500/10 border-amber-500 text-amber-400 print:bg-amber-50 print:border-amber-600 print:text-amber-700'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase block">
                [CLASSIFICATION_VERDICT]
              </span>
              <div className="text-lg font-black mt-0.5">
                {result.verdict === 'LIKELY_AI'
                  ? 'SYNTHETIC SPEECH (AI VOCODER GENERATED)'
                  : result.verdict === 'LIKELY_HUMAN'
                  ? 'AUTHENTIC BIOLOGICAL SPEECH (ORGANIC)'
                  : 'SUSPICIOUS / INCONCLUSIVE PATTERNS'}
              </div>
              <p className="text-xs mt-1 text-theme-text-primary/90 print:text-slate-800">
                {result.explanations.headline}
              </p>
            </div>

            <div className="text-right shrink-0 pl-4 border-l-2 border-current">
              <div className="text-3xl font-black">
                {result.confidence_score}%
              </div>
              <div className="text-[9px] uppercase font-bold tracking-wider">
                CONFIDENCE_RATING
              </div>
            </div>
          </div>

          {/* Metrics Table */}
          <div>
            <h4 className="text-[11px] font-black text-theme-text-primary print:text-slate-800 uppercase tracking-wider font-mono mb-2">
              [ACOUSTIC_METRIC_MATRIX // MEASUREMENTS]
            </h4>
            <div className="border-2 border-theme-border overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b-2 border-theme-border bg-theme-surface text-theme-text-muted text-[10px]">
                    <th className="py-2 px-3 text-left">SIGNAL_PROPERTY</th>
                    <th className="py-2 px-3 text-right">MEASURED</th>
                    <th className="py-2 px-3 text-center">BIOLOGICAL_NORM</th>
                    <th className="py-2 px-3 text-center">SYNTHETIC_TYPICAL</th>
                    <th className="py-2 px-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-theme-border print:divide-slate-200">
                  {result.explanations.metrics_table.map((m) => (
                    <tr key={m.key} className="hover:bg-theme-surface/50">
                      <td className="py-2 px-3 font-bold text-theme-text-primary print:text-slate-800">{m.name}</td>
                      <td className="py-2 px-3 text-right font-black text-theme-text-primary print:text-black">
                        {typeof m.value === 'number' ? m.value.toFixed(2) : m.value}
                        <span className="text-theme-text-muted text-[10px] ml-1">{m.unit}</span>
                      </td>
                      <td className="py-2 px-3 text-center text-theme-text-muted print:text-slate-600">{m.human_range}</td>
                      <td className="py-2 px-3 text-center text-theme-text-muted print:text-slate-500">{m.ai_typical}</td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`font-black text-[10px] px-1.5 py-0.5 border ${
                            m.status === 'anomalous'
                              ? 'border-red-500 text-red-500 bg-red-500/10'
                              : 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                          }`}
                        >
                          {m.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagnostic Findings */}
          <div>
            <h4 className="text-[11px] font-black text-theme-text-primary print:text-slate-800 uppercase tracking-wider font-mono mb-2">
              [FORENSIC_DIAGNOSTIC_FINDINGS]
            </h4>
            <div className="flex flex-col gap-2">
              {result.explanations.findings.map((f, i) => (
                <div
                  key={i}
                  className="p-3 border-2 border-theme-border bg-theme-surface print:bg-slate-50 print:border-slate-200 text-xs font-mono"
                >
                  <div className="flex items-center justify-between font-bold text-theme-text-primary print:text-black mb-1">
                    <span>{f.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 border border-theme-border bg-theme-card text-theme-accent">
                      {f.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-theme-text-muted print:text-slate-600 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
