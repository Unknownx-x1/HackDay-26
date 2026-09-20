import React from 'react';
import { Sliders } from 'lucide-react';
import type { AcousticMetricItem } from '../types';

interface AcousticMetricsTableProps {
  metrics: AcousticMetricItem[];
}

export const AcousticMetricsTable: React.FC<AcousticMetricsTableProps> = ({ metrics }) => {
  return (
    <div className="surface-card p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#1c2132] mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-slate-200 tracking-wide uppercase font-mono">
              Acoustic Feature Extraction Breakdown
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Clinical Baselines
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-3 text-left">
          Extracted signal metrics compared against peer-reviewed human vs. synthetic distributions:
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1c2132] text-slate-400 font-mono text-[10px] uppercase">
              <th className="py-2 px-2.5 font-medium">Signal Parameter</th>
              <th className="py-2 px-2.5 font-medium text-right">Measured</th>
              <th className="py-2 px-2.5 font-medium text-center">Biological Normal</th>
              <th className="py-2 px-2.5 font-medium text-center">AI Vocoder</th>
              <th className="py-2 px-2.5 font-medium text-right">Evaluation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171c2b]">
            {metrics.map((m) => {
              const isAnom = m.status === 'anomalous';
              return (
                <tr key={m.key} className="hover:bg-[#121622] transition">
                  <td className="py-2 px-2.5">
                    <div className="font-medium text-slate-200">{m.name}</div>
                    <div className="text-[10px] text-slate-500 max-w-xs truncate">
                      {m.description}
                    </div>
                  </td>

                  <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-100">
                    <span className={isAnom ? 'text-rose-400' : 'text-emerald-400'}>
                      {typeof m.value === 'number' ? m.value.toFixed(2) : m.value}
                      <span className="text-slate-500 text-[10px] ml-0.5">{m.unit}</span>
                    </span>
                  </td>

                  <td className="py-2 px-2.5 text-center font-mono text-slate-400 text-[11px]">
                    {m.human_range}
                  </td>

                  <td className="py-2 px-2.5 text-center font-mono text-slate-500 text-[11px]">
                    {m.ai_typical}
                  </td>

                  <td className="py-2 px-2.5 text-right">
                    {isAnom ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Anomalous
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Natural
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
