import React from 'react';
import {
  Radio,
  Activity,
  BarChart3,
  BookOpen,
  GitCompare,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import type { AnalysisResult } from '../types';

export type NavTab = 'scanner' | 'spectrogram' | 'statistics' | 'evidence' | 'comparator';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  analysisResult: AnalysisResult | null;
  activeAudioName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  analysisResult,
  activeAudioName,
}) => {
  const isAi = analysisResult?.verdict === 'LIKELY_AI';
  const isHuman = analysisResult?.verdict === 'LIKELY_HUMAN';

  const navItems: { id: NavTab; label: string; sublabel: string; icon: React.ReactNode }[] = [
    {
      id: 'scanner',
      label: 'Acoustic Screener',
      sublabel: 'Capture, upload & screen',
      icon: <Radio className="w-4 h-4" />,
    },
    {
      id: 'spectrogram',
      label: 'Spectrogram Lab',
      sublabel: 'Time-frequency STFT matrix',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'statistics',
      label: 'Forensic Statistics',
      sublabel: 'Acoustic metrics & deviations',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'evidence',
      label: 'Diagnostic Proofs',
      sublabel: 'Transparent signal audit',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'comparator',
      label: 'Side-by-Side Diff',
      sublabel: 'Target vs. biological human',
      icon: <GitCompare className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[var(--surface-bg)] border-r-[var(--border-w)] border-[var(--surface-border)] flex flex-col justify-between h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b-[var(--border-w)] border-[var(--surface-border)] flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-400 border-2 border-black flex items-center justify-center text-black font-black">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v20M17 5v14M7 8v8M22 10v4M2 10v4"/>
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-[var(--text-primary)] font-mono">
                VOICEPRINT
              </span>
              <span className="text-[9px] font-mono font-bold text-black px-1 bg-yellow-400 border border-black">
                v2.0
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider block text-left">
              Acoustic Forensics
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 flex flex-col gap-1.5 text-left">
          <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)] px-3 py-1 font-bold">
            WORKBENCH VIEWS
          </span>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all cursor-pointer text-left border-2 ${
                  isActive
                    ? 'bg-yellow-300 text-black border-black shadow-[3px_3px_0px_#000] font-black'
                    : 'border-transparent text-zinc-700 hover:text-black hover:border-black hover:bg-white hover:shadow-[2px_2px_0px_#000]'
                }`}
              >
                <div
                  className={`p-1.5 border-2 border-black transition ${
                    isActive
                      ? 'bg-black text-yellow-300'
                      : 'bg-white text-black'
                  }`}
                >
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono uppercase tracking-tight flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.id === 'statistics' && analysisResult && (
                      <span className="w-2 h-2 bg-black"></span>
                    )}
                  </div>
                  <div className="text-[9px] font-mono text-zinc-600 font-semibold truncate">
                    {item.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Clip Status Card */}
      <div className="p-3 border-t-2 border-black flex flex-col gap-2 text-left bg-[#ebebe0]">
        {analysisResult ? (
          <div
            className={`p-3 border-2 border-black shadow-[3px_3px_0px_#000] flex flex-col gap-1.5 ${
              isAi
                ? 'bg-red-200 text-black'
                : isHuman
                ? 'bg-emerald-200 text-black'
                : 'bg-amber-200 text-black'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
              <span className="truncate max-w-[120px]">
                {activeAudioName}
              </span>
              <span className="font-black bg-white px-1.5 py-0.5 border border-black">
                {analysisResult.confidence_score}%
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono font-black uppercase">
              {isAi ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>AI GENERATED</span>
                </>
              ) : isHuman ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>HUMAN VOICE</span>
                </>
              ) : (
                <span>BORDERLINE</span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 border-2 border-black bg-white text-[10px] font-mono font-bold text-zinc-600 text-center shadow-[2px_2px_0px_#000]">
            NO AUDIO SCANNED YET
          </div>
        )}

        <div className="flex items-center justify-between px-1 text-[9px] font-mono font-bold text-zinc-600">
          <span>DSP: Praat + Librosa</span>
          <span className="flex items-center gap-1 text-emerald-700 font-black">
            <span className="w-2 h-2 bg-emerald-500 border border-black inline-block"></span> ONLINE
          </span>
        </div>
      </div>
    </aside>
  );
};
