import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Activity, AlertCircle, Check } from 'lucide-react';
import { encodeWAV } from '../utils/audioEncoder';

interface AudioRecorderProps {
  onAnalyzeBlob: (blob: Blob, filename?: string) => void;
  isLoading: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAnalyzeBlob, isLoading }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [recordedUrl]);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startRecording = async () => {
    setMicError(null);
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    audioChunksRef.current = [];
    setRecordingTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioChunksRef.current.push(new Float32Array(inputData));
      };

      source.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(audioCtx.destination);

      setIsRecording(true);

      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 200);

      drawVisualizer();
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setMicError(err?.message || 'Could not access microphone. Please allow microphone permissions.');
      stopRecordingCleanup();
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#07090e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        ctx.fillStyle = '#6366f1';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    render();
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);

    const chunks = audioChunksRef.current;
    let totalLength = 0;
    for (const c of chunks) {
      totalLength += c.length;
    }
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }

    const sampleRate = audioContextRef.current?.sampleRate || 16000;
    stopRecordingCleanup();

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#07090e';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    if (totalLength < 16000 * 0.4) {
      setMicError('Recording too short (minimum 1 second required).');
      return;
    }

    const wavBlob = encodeWAV(merged, sampleRate);
    setRecordedBlob(wavBlob);
    setRecordedUrl(URL.createObjectURL(wavBlob));
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="brutal-card p-4 sm:p-5 h-full flex flex-col justify-between text-left">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--surface-border)] mb-3">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-yellow-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Stage Microphone Capture
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isRecording && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500 text-[10px] font-mono font-black animate-pulse">
                <span className="w-2 h-2 bg-rose-500"></span>
                REC {formatTimer(recordingTime)}
              </span>
            )}
            {!isRecording && recordedBlob && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500 text-[10px] font-mono font-bold">
                <Check className="w-3 h-3" /> CAPTURED ({formatTimer(recordingTime)})
              </span>
            )}
          </div>
        </div>

        <p className="text-[11px] font-mono text-[var(--text-secondary)] mb-3 text-left">
          Capture live voice samples from your microphone for instant acoustic screening:
        </p>
      </div>

      {/* Visualizer Area */}
      <div className="w-full h-24 bg-[#050608] border-2 border-[var(--surface-border)] relative flex items-center justify-center overflow-hidden mb-4">
        <canvas
          ref={canvasRef}
          width={400}
          height={96}
          className="w-full h-full object-cover"
        />

        {!isRecording && !recordedBlob && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-1 bg-[#050608]/90 pointer-events-none">
            <Activity className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-[10px] font-mono font-bold uppercase">Microphone Armed</span>
          </div>
        )}

        {recordedBlob && !isRecording && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#050608]/95 p-2">
            <audio src={recordedUrl || undefined} controls className="w-full max-w-xs h-8" />
          </div>
        )}
      </div>

      {micError && (
        <div className="mb-3 p-2 bg-rose-500/10 border-2 border-rose-500 text-rose-500 text-xs font-mono font-bold flex items-center gap-2 text-left">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>{micError}</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center gap-2 w-full justify-end">
        {!isRecording ? (
          <>
            <button
              onClick={startRecording}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 brutal-btn bg-[var(--surface-bg)] text-[var(--text-primary)] hover:bg-yellow-400 hover:text-black text-xs font-mono font-bold uppercase transition cursor-pointer disabled:opacity-50"
            >
              <Mic className="w-3.5 h-3.5 text-rose-500" />
              <span>{recordedBlob ? 'RE-RECORD' : 'RECORD MIC'}</span>
            </button>

            {recordedBlob && (
              <button
                onClick={() => onAnalyzeBlob(recordedBlob, `live_mic_${Date.now()}.wav`)}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 px-4 py-1.5 brutal-btn bg-yellow-400 text-black border-2 border-black text-xs font-mono font-black uppercase transition cursor-pointer disabled:opacity-50"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{isLoading ? 'ANALYZING...' : 'SCREEN AUDIO'}</span>
              </button>
            )}
          </>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center justify-center gap-1.5 px-4 py-1.5 brutal-btn bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase transition cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>STOP ({formatTimer(recordingTime)})</span>
          </button>
        )}
      </div>
    </div>
  );
};
