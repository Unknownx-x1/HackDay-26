import React, { useState } from 'react';
import { ExplanationsDrawer } from '../ExplanationsDrawer';
import { AuditReportModal } from '../AuditReportModal';
import type { AnalysisResult } from '../../types';
import { BookOpen, Printer } from 'lucide-react';

interface EvidenceViewProps {
  analysisResult: AnalysisResult | null;
  activeAudioName: string;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({
  analysisResult,
  activeAudioName,
}) => {
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  if (!analysisResult) {
    return (
      <div className="brutal-card p-12 text-center flex flex-col items-center justify-center gap-3">
        <BookOpen className="w-8 h-8 text-[var(--text-muted)] animate-pulse" />
        <h3 className="text-sm font-mono font-bold uppercase text-[var(--text-primary)]">No Diagnostic Evidence</h3>
        <p className="text-xs font-mono text-[var(--text-muted)] max-w-sm">
          Screen an audio recording from the Acoustic Screener to view interpretable diagnostic evidence cards and compliance proofs.
        </p>
      </div>
    );
  }

  const isAi = analysisResult.verdict === 'LIKELY_AI';

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-black">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-black uppercase tracking-tight text-black mb-0.5">
            Diagnostic Proofs & Evidence
          </h1>
          <p className="text-xs text-zinc-700 font-mono">
            Transparent, physics-grounded acoustic rationale explaining which signal dimensions determined classification
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-2 px-4 py-2 brutal-btn bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black text-xs font-mono font-black uppercase shadow-[3px_3px_0px_#000] transition cursor-pointer shrink-0"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>[GENERATE FORENSIC AUDIT CERTIFICATE]</span>
        </button>
      </div>

      {/* Primary Evidence Explanations */}
      <ExplanationsDrawer
        findings={analysisResult.explanations.findings}
        isAi={isAi}
      />

      {/* Embedded Audit Sheet Modal */}
      {showReportModal && (
        <AuditReportModal
          result={analysisResult}
          onClose={() => setShowReportModal(false)}
          audioFilename={activeAudioName}
        />
      )}
    </div>
  );
};
