import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Sparkles, RefreshCw, Layers, ShieldAlert } from 'lucide-react';

export default function AIRecommendationCard({ complaintId, analysis, onReanalyzeComplete }) {
  const [reanalyzing, setReanalyzing] = useState(false);

  if (!analysis) return null;

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const res = await api.post('/ai/reanalyze/', { complaint_id: complaintId });
      if (res.data.success) {
        toast.success('Complaint successfully reanalyzed by AI Engine!');
        if (onReanalyzeComplete) onReanalyzeComplete();
      }
    } catch (err) {
      toast.error('Re-analysis failed or access denied.');
    } finally {
      setReanalyzing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
          <h3 className="text-base font-bold text-slate-850 dark:text-white">AI Routing Recommendations</h3>
        </div>
        
        <button
          onClick={handleReanalyze}
          disabled={reanalyzing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-[10px] font-bold rounded-lg text-slate-655"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} /> Reanalyze
        </button>
      </div>

      <div className="space-y-3.5 text-sm text-slate-600">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-slate-400" />
          <div>
            <div className="text-[10px] text-slate-405">Recommended Department</div>
            <div className="font-bold text-slate-800 dark:text-white mt-0.5">{analysis.predicted_department}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-slate-400" />
          <div>
            <div className="text-[10px] text-slate-405">Predicted Severity / Priority</div>
            <div className="font-bold text-slate-800 dark:text-white mt-0.5">
              {analysis.predicted_severity} / {analysis.predicted_priority}
            </div>
          </div>
        </div>
      </div>
      
      {analysis.explanation && (
        <div className="text-[11px] text-slate-450 leading-relaxed pt-3 border-t border-slate-100 dark:border-slate-850">
          <strong>Decision explanation:</strong> {analysis.explanation}
        </div>
      )}
    </div>
  );
}
