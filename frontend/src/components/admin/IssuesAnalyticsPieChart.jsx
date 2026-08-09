import React, { useState } from 'react';
import { PieChart as PieIcon, CheckCircle2, AlertCircle, Clock, TrendingUp, ShieldCheck } from 'lucide-react';

export default function IssuesAnalyticsPieChart({ metrics }) {
  const [activeSlice, setActiveSlice] = useState(null);

  if (!metrics) return null;

  const totalRaised = metrics.issues_raised || metrics.total_complaints || 0;
  const resolved = (metrics.resolved_complaints || 0) + (metrics.closed_complaints || 0);
  const inProgress = metrics.in_progress_complaints || 0;
  const pending = metrics.pending_complaints || 0;
  const escalated = metrics.escalated_complaints || 0;

  const resPercent = totalRaised > 0 ? ((resolved / totalRaised) * 100).toFixed(1) : '0.0';

  // Pie chart slice configuration
  const slices = [
    { key: 'resolved', label: 'Issues Resolved', count: resolved, color: '#10b981', hoverColor: '#059669', bgClass: 'bg-emerald-500' },
    { key: 'inProgress', label: 'In Progress', count: inProgress, color: '#3b82f6', hoverColor: '#2563eb', bgClass: 'bg-blue-500' },
    { key: 'pending', label: 'Pending Review', count: pending, color: '#f59e0b', hoverColor: '#d97706', bgClass: 'bg-amber-500' },
    { key: 'escalated', label: 'Escalated / Rerouted', count: escalated, color: '#ef4444', hoverColor: '#dc2626', bgClass: 'bg-rose-500' }
  ].filter(s => s.count > 0 || totalRaised === 0);

  // SVG Donut calculation
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedPercent = 0;

  return (
    <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
      {/* Card Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 dark:border-slate-700/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <PieIcon className="w-4 h-4" /> Issues Analytics & Status Breakdown
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
            Grievances Raised vs. Resolved Overview
          </h2>
        </div>

        {/* Resolution Efficiency Badge */}
        <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 rounded-2xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <div className="text-xs">
            <span className="font-semibold">Resolution Rate: </span>
            <strong className="text-sm font-black">{resPercent}%</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* SVG Donut / Pie Chart Display */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              {/* Background Track */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="24"
                fill="transparent"
              />

              {/* Slices */}
              {totalRaised > 0 && slices.map((slice) => {
                const slicePercent = slice.count / totalRaised;
                const strokeDasharray = `${slicePercent * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedPercent * circumference;
                accumulatedPercent += slicePercent;

                const isHovered = activeSlice === slice.key;

                return (
                  <circle
                    key={slice.key}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={isHovered ? slice.hoverColor : slice.color}
                    strokeWidth={isHovered ? "28" : "24"}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setActiveSlice(slice.key)}
                    onMouseLeave={() => setActiveSlice(null)}
                  />
                );
              })}
            </svg>

            {/* Donut Center Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-3xl font-black text-slate-800 dark:text-white">{totalRaised}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Raised</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 italic text-center">Hover over chart slices to inspect exact ratios</p>
        </div>

        {/* Breakdown Statistics & Legends */}
        <div className="lg:col-span-7 space-y-4">
          {/* Executive Summary Counters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40">
              <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                <span>Issues Raised</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-white">{totalRaised}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Total registered grievances</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40">
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                <span>Issues Resolved</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-white">{resolved}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{resPercent}% successful resolution</div>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="space-y-2.5 pt-2">
            {slices.map((slice) => {
              const pct = totalRaised > 0 ? ((slice.count / totalRaised) * 100).toFixed(1) : 0;
              const isHovered = activeSlice === slice.key;

              return (
                <div
                  key={slice.key}
                  onMouseEnter={() => setActiveSlice(slice.key)}
                  onMouseLeave={() => setActiveSlice(null)}
                  className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-between border ${
                    isHovered 
                      ? 'bg-slate-100/80 dark:bg-slate-800/80 border-blue-400/50 shadow-md scale-[1.01]' 
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3.5 h-3.5 rounded-full ${slice.bgClass} shadow-sm shrink-0`} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{slice.label}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white">{slice.count} tickets</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 min-w-[50px] text-right">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resolution Progress Bar */}
          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>Overall Resolution Completion</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{resPercent}% Completed</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300/30 dark:border-slate-700/50">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${resPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
