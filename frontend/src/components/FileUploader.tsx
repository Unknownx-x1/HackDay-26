import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, Check, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onAnalyzeFile: (file: File) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onAnalyzeFile, isLoading }) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.includes('audio') && !file.name.match(/\.(wav|mp3|ogg|flac|m4a|webm|aac)$/i)) {
      setErrorMsg('Please upload a valid audio file (WAV, MP3, OGG, FLAC, M4A, WebM).');
      return;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <div className="brutal-card p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b-2 border-theme-border mb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-theme-accent" />
            <h3 className="text-xs font-black tracking-wider uppercase font-mono text-theme-text-primary">
              [INPUT // FILE_PAYLOAD]
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 border border-theme-border text-theme-text-muted">
            WAV / MP3 / FLAC / OGG
          </span>
        </div>

        <p className="text-xs text-theme-text-muted mb-3 text-left font-mono">
          Upload forensic audio recording for micro-perturbation analysis:
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`h-28 border-2 border-dashed transition-colors flex flex-col items-center justify-center p-3 cursor-pointer ${
          dragActive
            ? 'border-theme-accent bg-theme-accent/10'
            : selectedFile
            ? 'border-theme-border bg-theme-surface'
            : 'border-theme-border hover:border-theme-accent bg-theme-surface/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a,.webm"
          onChange={handleChange}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center text-center gap-1.5 pointer-events-none">
            <FileAudio className="w-6 h-6 text-theme-text-muted" />
            <p className="text-xs text-theme-text-primary font-mono font-bold">
              DROP AUDIO FILE OR <span className="text-theme-accent underline">BROWSE</span>
            </p>
            <p className="text-[10px] font-mono text-theme-text-muted">
              Raw PCM or compressed voice payloads accepted
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full px-2" onClick={(e) => e.stopPropagation()}>
            <div className="p-2 border border-theme-border bg-theme-surface text-theme-accent">
              <FileAudio className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-mono font-black text-theme-text-primary truncate">{selectedFile.name}</p>
              <p className="text-[10px] font-mono text-theme-text-muted">
                SIZE: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB // TYPE: {selectedFile.type || 'AUDIO'}
              </p>
            </div>
            {previewUrl && (
              <audio src={previewUrl} controls className="h-8 max-w-[160px]" />
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-3 p-2.5 border-2 border-red-500 bg-red-950/20 text-red-400 text-xs font-mono flex items-center gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>ERR // {errorMsg}</span>
        </div>
      )}

      {/* Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => selectedFile && onAnalyzeFile(selectedFile)}
          disabled={!selectedFile || isLoading}
          className="brutal-btn-primary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
        >
          <Check className="w-4 h-4" />
          <span>{isLoading ? '[SCREENING_PAYLOAD...]' : '[EXECUTE_SCREENING]'}</span>
        </button>
      </div>
    </div>
  );
};
