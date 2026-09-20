import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { ScannerView } from './components/views/ScannerView';
import { SpectrogramView } from './components/views/SpectrogramView';
import { StatisticsView } from './components/views/StatisticsView';
import { EvidenceView } from './components/views/EvidenceView';
import { ComparatorView } from './components/views/ComparatorView';
import type { SampleItem, AnalysisResult } from './types';
import { Activity, AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('scanner');
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [activeAudioName, setActiveAudioName] = useState<string>('sample_capture.wav');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    loadSamples();
  }, []);

  const loadSamples = async () => {
    try {
      const res = await fetch('/api/samples');
      const data = await res.json();
      if (data.status === 'success' && data.samples) {
        setSamples(data.samples);
        const initialSample = data.samples.find((s: SampleItem) => s.id === 'ai_elevenlabs_clone') || data.samples[0];
        if (initialSample) {
          handleSelectSample(initialSample.id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch samples:', err);
    }
  };

  const handleSelectSample = async (sampleId: string) => {
    setSelectedSampleId(sampleId);
    setActiveAudioUrl(`/api/sample/${sampleId}/audio`);
    const found = samples.find((s: SampleItem) => s.id === sampleId);
    if (found) {
      setActiveAudioName(found.filename);
    }
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('sample_id', sampleId);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.status === 'success') {
        setAnalysisResult(data.result);
      } else {
        setError(data.detail || 'Failed to analyze sample');
      }
    } catch (err: any) {
      setError(err?.message || 'Server analysis error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeBlob = async (blob: Blob, filename?: string) => {
    setSelectedSampleId(null);
    const url = URL.createObjectURL(blob);
    setActiveAudioUrl(url);
    setActiveAudioName(filename || 'live_microphone_recording.wav');
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', blob, filename || 'mic_recording.wav');
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.status === 'success') {
        setAnalysisResult(data.result);
      } else {
        setError(data.detail || 'Analysis failed on live audio');
      }
    } catch (err: any) {
      setError(err?.message || 'Server connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeFile = async (file: File) => {
    setSelectedSampleId(null);
    const url = URL.createObjectURL(file);
    setActiveAudioUrl(url);
    setActiveAudioName(file.name);
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.status === 'success') {
        setAnalysisResult(data.result);
      } else {
        setError(data.detail || 'Failed to process audio file');
      }
    } catch (err: any) {
      setError(err?.message || 'File upload error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setSelectedSampleId(null);
    setActiveAudioUrl(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f5ee] text-black flex flex-row font-sans selection:bg-yellow-300 selection:text-black">
      {/* Left Sidebar Navigation */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block fixed lg:relative z-40`}>
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          analysisResult={analysisResult}
          activeAudioName={activeAudioName}
        />
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onReset={handleReset}
          activeAudioName={activeAudioName}
          analysisResult={analysisResult}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* View Container */}
        <main className="flex-1 p-5 sm:p-8 max-w-6xl w-full mx-auto flex flex-col gap-6">
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-red-100 border-2 border-black text-black text-xs font-mono font-bold flex items-center justify-between shadow-[3px_3px_0px_#000]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>ERR // {error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-xs font-mono underline hover:text-red-700 cursor-pointer"
              >
                [DISMISS]
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="brutal-card p-8 flex flex-col items-center justify-center gap-3 bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
              <Activity className="w-7 h-7 text-black animate-spin" />
              <p className="text-xs font-mono text-black font-black tracking-wide uppercase">
                [ANALYZING LARYNGEAL PERTURBATIONS, HARMONICS & BREATH GAPS...]
              </p>
            </div>
          )}

          {/* Active View Component */}
          {activeTab === 'scanner' && (
            <ScannerView
              samples={samples}
              selectedSampleId={selectedSampleId}
              onSelectSample={handleSelectSample}
              onAnalyzeBlob={handleAnalyzeBlob}
              onAnalyzeFile={handleAnalyzeFile}
              analysisResult={analysisResult}
              isLoading={isLoading}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'spectrogram' && (
            <SpectrogramView
              analysisResult={analysisResult}
              activeAudioUrl={activeAudioUrl}
              activeAudioName={activeAudioName}
            />
          )}

          {activeTab === 'statistics' && (
            <StatisticsView
              analysisResult={analysisResult}
              activeAudioName={activeAudioName}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceView
              analysisResult={analysisResult}
              activeAudioName={activeAudioName}
            />
          )}

          {activeTab === 'comparator' && (
            <ComparatorView
              analysisResult={analysisResult}
              activeAudioUrl={activeAudioUrl}
              activeAudioName={activeAudioName}
              samples={samples}
            />
          )}
        </main>
      </div>
    </div>
  );
}
