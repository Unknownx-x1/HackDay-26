import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Activity, AlertTriangle, Download } from 'lucide-react';
import type { SpectrogramData } from '../types';

interface SpectrogramViewerProps {
  spectrogram: SpectrogramData;
  audioUrl?: string | null;
  title?: string;
  showAnomalies?: boolean;
}

export const SpectrogramViewer: React.FC<SpectrogramViewerProps> = ({
  spectrogram,
  audioUrl,
  title = "STFT Time-Frequency Heatmap",
  showAnomalies = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const duration = spectrogram.duration_sec || 4.0;
  const timeBins = spectrogram.time_bins || 120;
  const freqBins = spectrogram.freq_bins || 64;

  // High-contrast colormap (Obsidian -> Navy -> Cyan -> Amber -> Gold)
  const getColormapRgb = (val: number): [number, number, number] => {
    const v = Math.max(0, Math.min(1, val));
    if (v < 0.22) {
      const t = v / 0.22;
      return [Math.floor(9 + 18 * t), Math.floor(12 + 18 * t), Math.floor(20 + 55 * t)];
    } else if (v < 0.50) {
      const t = (v - 0.22) / 0.28;
      return [Math.floor(27 - 21 * t), Math.floor(30 + 150 * t), Math.floor(75 + 135 * t)];
    } else if (v < 0.78) {
      const t = (v - 0.50) / 0.28;
      return [Math.floor(6 + 235 * t), Math.floor(180 - 25 * t), Math.floor(210 - 195 * t)];
    } else {
      const t = (v - 0.78) / 0.22;
      return [Math.floor(241 + 14 * t), Math.floor(155 + 95 * t), Math.floor(15 + 230 * t)];
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const matrix = spectrogram.matrix;

    if (!matrix || matrix.length === 0) return;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Render STFT matrix
    for (let py = 0; py < height; py++) {
      const freqIdx = Math.floor(((height - 1 - py) / height) * freqBins);
      const row = matrix[Math.min(freqBins - 1, Math.max(0, freqIdx))] || [];

      for (let px = 0; px < width; px++) {
        const timeIdx = Math.floor((px / width) * timeBins);
        const intensity = row[Math.min(row.length - 1, Math.max(0, timeIdx))] || 0.0;

        const [r, g, b] = getColormapRgb(intensity);
        const pixelIdx = (py * width + px) * 4;
        data[pixelIdx] = r;
        data[pixelIdx + 1] = g;
        data[pixelIdx + 2] = b;
        data[pixelIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Draw anomaly regions on canvas with clean vertical markers
    if (showAnomalies && spectrogram.anomalies) {
      spectrogram.anomalies.forEach((anomaly) => {
        const startX = (anomaly.start_sec / duration) * width;
        const endX = (anomaly.end_sec / duration) * width;
        const boxWidth = Math.max(8, endX - startX);

        ctx.strokeStyle = anomaly.type === 'hf_spectral_cutoff' ? '#eab308' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);

        if (anomaly.type === 'hf_spectral_cutoff') {
          ctx.strokeRect(startX, 0, boxWidth, height * 0.35);
          ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
          ctx.fillRect(startX, 0, boxWidth, height * 0.35);
        } else {
          ctx.strokeRect(startX, 0, boxWidth, height);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          ctx.fillRect(startX, 0, boxWidth, height);
        }
        ctx.setLineDash([]);
      });
    }

    // Playback scrubber line
    if (duration > 0) {
      const scrubX = (currentTime / duration) * width;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scrubX, 0);
      ctx.lineTo(scrubX, height);
      ctx.stroke();
    }
  }, [spectrogram, currentTime, showAnomalies, duration, timeBins, freqBins]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className="brutal-card p-4 sm:p-5 flex flex-col gap-3.5 text-left">
      {/* Header with Title and Calibrated Colormap Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[var(--surface-border)]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-yellow-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
            {title}
          </h3>
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
          <span className="font-bold">-70 dB</span>
          <div className="w-24 h-2.5 border border-[var(--surface-border)] bg-gradient-to-r from-[#141b2a] via-[#06b6d4] via-[#eab308] to-[#fef08a]" />
          <span className="font-bold text-[var(--text-primary)]">0 dB</span>
        </div>
      </div>

      {/* Spectrogram Canvas with Axes */}
      <div className="flex gap-2">
        {/* Frequency Y-Axis */}
        <div className="flex flex-col justify-between py-1 text-[9px] font-mono font-bold text-[var(--text-muted)] shrink-0 select-none text-right w-12 border-r-2 border-[var(--surface-border)] pr-1.5">
          <span>8.0 kHz</span>
          <span>6.0 kHz</span>
          <span>4.0 kHz</span>
          <span>2.0 kHz</span>
          <span>0.0 Hz</span>
        </div>

        {/* Clean Canvas Surface (NO OVERLAYS BLOCKING THE SPECTRUM) */}
        <div className="flex-1 relative overflow-hidden border-2 border-[var(--surface-border)] bg-[#050608] cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={640}
            height={200}
            onClick={handleCanvasClick}
            className="w-full h-44 sm:h-52 object-fill block"
          />
        </div>
      </div>

      {/* Time X-Axis */}
      <div className="flex justify-between pl-14 text-[9px] font-mono font-bold text-[var(--text-muted)] select-none border-t border-[var(--surface-border)] pt-1">
        <span>0.00s</span>
        <span>{(duration * 0.25).toFixed(2)}s</span>
        <span>{(duration * 0.5).toFixed(2)}s</span>
        <span>{(duration * 0.75).toFixed(2)}s</span>
        <span>{duration.toFixed(2)}s</span>
      </div>

      {/* Dedicated Anomaly Telemetry Bar (Placed cleanly BELOW canvas) */}
      {showAnomalies && spectrogram.anomalies && spectrogram.anomalies.length > 0 && (
        <div className="p-2.5 bg-[var(--surface-sub)] border-2 border-[var(--surface-border)] flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[var(--text-primary)] mr-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Spectrogram Anomalies ({spectrogram.anomalies.length}):</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {spectrogram.anomalies.map((anom, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                  anom.type === 'hf_spectral_cutoff'
                    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                }`}
              >
                {anom.title} [{anom.start_sec.toFixed(2)}s – {anom.end_sec.toFixed(2)}s]
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hardware Transport & Player Controls */}
      {audioUrl && (
        <div className="pt-2 border-t-2 border-[var(--surface-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={togglePlay}
              className={`px-3.5 py-1.5 brutal-btn text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer ${
                isPlaying
                  ? 'bg-yellow-400 text-black border-yellow-500'
                  : 'bg-[var(--surface-bg)] text-[var(--text-primary)]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY CLIP</span>
                </>
              )}
            </button>

            <span className="text-xs font-mono font-bold text-[var(--text-primary)] min-w-[120px]">
              {currentTime.toFixed(2)}s <span className="text-[var(--text-muted)]">/ {duration.toFixed(2)}s</span>
            </span>

            {/* Scrubber slider */}
            <input
              type="range"
              min="0"
              max={duration || 4}
              step="0.02"
              value={currentTime}
              onChange={(e) => {
                const newT = parseFloat(e.target.value);
                if (audioRef.current) {
                  audioRef.current.currentTime = newT;
                }
                setCurrentTime(newT);
              }}
              className="flex-1 sm:w-56 accent-yellow-400 cursor-pointer h-2 bg-[var(--surface-sub)] border border-[var(--surface-border)]"
            />
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            className="hidden"
          />

          <a
            href={audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono font-bold uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 border-b border-[var(--text-muted)] pb-0.5"
          >
            <Download className="w-3 h-3" />
            <span>Raw WAV File</span>
          </a>
        </div>
      )}
    </div>
  );
};
