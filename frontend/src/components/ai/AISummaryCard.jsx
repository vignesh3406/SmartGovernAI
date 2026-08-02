import React from 'react';
import { Cpu, AlertTriangle, Smile, ShieldAlert } from 'lucide-react';

export default function AISummaryCard({ analysis }) {
  if (!analysis) return null;

  const isLowConfidence = analysis.confidence_score < 60;
  const sentimentColors = {
    Neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400',
    Concerned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    Urgent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    Emergency: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">AI Analysis Engine</h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sentimentColors[analysis.sentiment] || 'bg-slate-100 text-slate-755'}`}>
          {analysis.sentiment} Tone
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Summary</span>
          <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1 leading-relaxed">
            {analysis.short_summary || 'No summary available.'}
          </p>
        </div>

        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citizen Updates Summary</span>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {analysis.citizen_summary || 'Reviewing submitted details.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-850">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confidence Score</div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="text-lg font-extrabold text-slate-850 dark:text-white">{analysis.confidence_score}%</div>
              {isLowConfidence ? (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              ) : (
                <Smile className="w-4 h-4 text-emerald-500" />
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Execution Latency</div>
            <div className="text-lg font-extrabold text-slate-850 dark:text-white mt-1">
              {analysis.execution_time.toFixed(2)}s
            </div>
          </div>
        </div>
      </div>

      {isLowConfidence && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-xl flex gap-2.5 text-xs text-rose-800 dark:text-rose-400 leading-relaxed">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            <strong>Attention:</strong> AI confidence is below 60%. This complaint has been flagged for manual verification by a department administrator.
          </span>
        </div>
      )}
    </div>
  );
}
