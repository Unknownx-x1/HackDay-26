export interface SampleItem {
  id: string;
  filename: string;
  title: string;
  speaker: string;
  expected_label: string;
  expected_badge: string;
  description: string;
  type: 'human' | 'ai';
}

export interface ForensicFinding {
  feature: string;
  title: string;
  severity: 'high' | 'medium' | 'info';
  badge: string;
  description: string;
  evidence: string;
}

export interface AcousticMetricItem {
  key: string;
  name: string;
  value: number;
  unit: string;
  human_range: string;
  ai_typical: string;
  status: 'anomalous' | 'normal';
  description: string;
}

export interface RadarItem {
  metric: string;
  sample_value: number;
  human_baseline: number;
  ai_baseline: number;
  code?: string;
  full_name?: string;
  raw_value?: number | string;
  unit?: string;
  is_anomalous?: boolean;
  status?: string;
}

export interface SpectrogramAnomaly {
  start_sec: number;
  end_sec: number;
  type: string;
  title: string;
  description: string;
  severity: string;
}

export interface SpectrogramData {
  duration_sec: number;
  freq_bins: number;
  time_bins: number;
  matrix: number[][];
  anomalies: SpectrogramAnomaly[];
}

export interface AnalysisResult {
  verdict: 'LIKELY_AI' | 'LIKELY_HUMAN' | 'UNCERTAIN';
  ai_probability: number;
  human_probability: number;
  confidence_score: number;
  risk_level: 'CRITICAL_SYNTHETIC' | 'HIGH_SYNTHETIC' | 'BORDERLINE' | 'AUTHENTIC_NATURAL';
  explanations: {
    headline: string;
    findings: ForensicFinding[];
    metrics_table: AcousticMetricItem[];
    radar_data: RadarItem[];
  };
  features: Record<string, any>;
  spectrogram: SpectrogramData;
}

export interface CompareResult {
  target: {
    verdict: string;
    ai_probability: number;
    features: Record<string, any>;
    spectrogram: SpectrogramData;
  };
  reference: {
    verdict: string;
    ai_probability: number;
    features: Record<string, any>;
    spectrogram: SpectrogramData;
  };
  comparison: {
    jitter_ratio: string;
    shimmer_ratio: string;
    hnr_delta: string;
    summary: string;
  };
}
