import React, { useState } from 'react';
import { AudioRecorder } from '../AudioRecorder';
import { FileUploader } from '../FileUploader';
import { SampleSelector } from '../SampleSelector';
import { VerdictCard } from '../VerdictCard';
import type { SampleItem, AnalysisResult } from '../../types';
import { ArrowRight, Activity, BarChart3, Mic, UploadCloud } from 'lucide-react';
import type { NavTab } from '../Sidebar';

interface ScannerViewProps {
  samples: SampleItem[];
  selectedSampleId: string | null;
  onSelectSample: (sampleId: string) => void;
  onAnalyzeBlob: (blob: Blob, filename?: string) => void;
  onAnalyzeFile: (file: File) => void;
  analysisResult: AnalysisResult | null;
  isLoading: boolean;
  onNavigateTab: (tab: NavTab) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  samples,
  selectedSampleId,
  onSelectSample,
  onAnalyzeBlob,
  onAnalyzeFile,
  analysisResult,
  isLoading,
  onNavigateTab,
}) => {
  const [inputTab, setInputTab] = useState<'mic' | 'upload'>('mic');

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-[var(--surface-border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-black uppercase tracking-tight text-[var(--text-primary)] mb-0.5">
            Acoustic Screener
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-mono">
            Deterministic detection of vocal micro-tremors, harmonic regularity & pause silence decay
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[var(--surface-sub)] border-2 border-[var(--surface-border)] text-xs text-[var(--text-secondary)] font-mono shrink-0">
          <span className="w-2 h-2 bg-emerald-500"></span>
          <span>DSP: <strong className="text-[var(--text-primary)]">16.0 kHz Mono</strong></span>
          <span className="text-[var(--surface-border)]">|</span>
          <span>Latency: <strong className="text-emerald-500">&lt;18ms</strong></span>
        </div>
      </div>

      {/* Input Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Input Selection (Mic or File) */}
        <div className="lg:col-span-5 flex flex-col gap-2.5">
          {/* Tab Selector Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-[#ebebe0] border-2 border-black w-fit shadow-[2px_2px_0px_#000]">
            <button
              onClick={() => setInputTab('mic')}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                inputTab === 'mic'
                  ? 'bg-yellow-300 text-black border-2 border-black shadow-[2px_2px_0px_#000] font-black'
                  : 'border-2 border-transparent text-zinc-600 hover:text-black hover:bg-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Live Microphone</span>
            </button>
            <button
              onClick={() => setInputTab('upload')}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                inputTab === 'upload'
                  ? 'bg-yellow-300 text-black border-2 border-black shadow-[2px_2px_0px_#000] font-black'
                  : 'border-2 border-transparent text-zinc-600 hover:text-black hover:bg-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Audio</span>
            </button>
          </div>

          <div className="flex-1">
            {inputTab === 'mic' ? (
              <AudioRecorder onAnalyzeBlob={onAnalyzeBlob} isLoading={isLoading} />
            ) : (
              <FileUploader onAnalyzeFile={onAnalyzeFile} isLoading={isLoading} />
            )}
          </div>
        </div>

        {/* Right: Calibration Audio Corpus */}
        <div className="lg:col-span-7 flex flex-col">
          <SampleSelector
            samples={samples}
            selectedSampleId={selectedSampleId}
            onSelectSample={onSelectSample}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Primary Verdict Card */}
      {analysisResult && !isLoading && (
        <div className="flex flex-col gap-4 mt-2">
          <VerdictCard result={analysisResult} />

          {/* Industrial Action Bar */}
          <div className="p-4 brutal-card flex flex-col sm:flex-row items-center justify-between gap-3 border-2 border-black border-l-8 border-l-yellow-400 bg-white shadow-[4px_4px_0px_#000]">
            <div className="text-xs font-mono font-black uppercase text-black">
              SCREENING COMPLETE // DEEP FORENSIC DIAGNOSTICS READY:
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onNavigateTab('spectrogram')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 brutal-btn bg-white hover:bg-yellow-300 text-black text-xs font-mono font-bold uppercase transition cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>SPECTROGRAM LAB</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>

              <button
                onClick={() => onNavigateTab('statistics')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 brutal-btn bg-white hover:bg-yellow-300 text-black text-xs font-mono font-bold uppercase transition cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>STATISTICS MATRIX</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
