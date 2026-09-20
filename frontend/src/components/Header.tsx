import React from 'react';
import { RefreshCw, Menu } from 'lucide-react';
import type { NavTab } from './Sidebar';
import type { AnalysisResult } from '../types';

interface HeaderProps {
  activeTab: NavTab;
  onReset: () => void;
  activeAudioName: string;
  analysisResult: AnalysisResult | null;
  onToggleMobileMenu?: () => void;
}

const TAB_TITLES: Record<NavTab, string> = {
  scanner: 'Acoustic Screener',
  spectrogram: 'Spectrogram Laboratory',
  statistics: 'Forensic Statistics',
  evidence: 'Diagnostic Proofs',
  comparator: 'Side-by-Side Comparator',
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onReset,
  activeAudioName,
  analysisResult,
  onToggleMobileMenu,
}) => {
  const isAi = analysisResult?.verdict === 'LIKELY_AI';
  const isHuman = analysisResult?.verdict === 'LIKELY_HUMAN';

  return (
    <header className="border-b-2 border-black bg-white sticky top-0 z-30 px-4 sm:px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mobile Menu & Breadcrumb */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 brutal-btn bg-[#ebebe0] text-black cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-500 uppercase tracking-wider font-bold">VOICEPRINT</span>
            <span className="text-black font-black">/</span>
            <span className="text-black font-black uppercase tracking-tight bg-yellow-300 px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_#000]">
              {TAB_TITLES[activeTab]}
            </span>
          </div>
        </div>

        {/* Center: Neobrutalist Telemetry Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#ebebe0] border-2 border-black font-mono text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000]">
          <span className="w-2.5 h-2.5 bg-emerald-400 border border-black inline-block"></span>
          <span>FORENSIC ENGINE // 16.0 kHz MONO // ZERO-GPU INFERENCE</span>
        </div>

        {/* Right: Active Clip & Reset Button */}
        <div className="flex items-center gap-2.5">
          {analysisResult && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#ebebe0] border-2 border-black text-xs font-mono shadow-[2px_2px_0px_#000]">
              <span className="text-zinc-600 text-[10px] uppercase font-bold">ACTIVE:</span>
              <span className="text-black font-black truncate max-w-[130px]">
                {activeAudioName}
              </span>
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 border-2 border-black ${
                  isAi
                    ? 'bg-red-400 text-black'
                    : isHuman
                    ? 'bg-emerald-400 text-black'
                    : 'bg-amber-300 text-black'
                }`}
              >
                {analysisResult.verdict}
              </span>
            </div>
          )}

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 brutal-btn bg-white hover:bg-yellow-300 text-black text-xs font-mono font-black uppercase transition cursor-pointer"
            title="Reset active scan"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">[RESET]</span>
          </button>
        </div>
      </div>
    </header>
  );
};
