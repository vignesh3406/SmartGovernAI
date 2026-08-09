import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Cpu, Users, ShieldAlert, FileText, CheckCircle, BarChart3, 
  Settings, FolderLock, History, ExternalLink 
} from 'lucide-react';

import IssuesAnalyticsPieChart from '../../components/admin/IssuesAnalyticsPieChart';

export default function AdminPortal() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.get('/admin/dashboard/');
        setMetrics(res.data.data.metrics);
      } catch (err) {
        toast.error('Failed to load admin metrics');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-xs font-semibold text-slate-400">Loading system metrics & analytics...</p>
      </div>
    );
  }

  const cards = [
    { label: 'Total Citizens Registered', count: metrics?.total_citizens || 0, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Resolving Officers Active', count: metrics?.total_officers || 0, icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
    { label: 'Total Issues Raised', count: metrics?.issues_raised || metrics?.total_complaints || 0, icon: FileText, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Pending Action Queue', count: metrics?.pending_complaints || 0, icon: ShieldAlert, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
    { label: 'In Progress Resolution', count: metrics?.in_progress_complaints || 0, icon: BarChart3, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' },
    { label: 'Issues Successfully Resolved', count: metrics?.issues_resolved || metrics?.resolved_complaints || 0, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/10 relative overflow-hidden">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest font-display">System Control & Operations</span>
          <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-white">Administration Console</h1>
          <p className="text-slate-350 text-xs md:text-sm mt-1 max-w-xl">Real-time audit portal to monitor civic grievances raised, track resolution velocity, and manage authority workflows.</p>
        </div>
        <div className="bg-white/10 border border-white/15 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2.5 backdrop-blur-md shrink-0">
          <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span className="font-medium text-slate-200">AI Engine status: <strong className="text-emerald-400 font-bold">Operational</strong></span>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">{c.label}</span>
                <div className="text-3xl md:text-4xl font-black font-number text-slate-800 dark:text-white mt-1 tracking-tight">{c.count}</div>
              </div>
              <div className={`p-4 rounded-2xl ${c.color} shrink-0 shadow-sm`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pie Chart & Resolution Analytics */}
      <IssuesAnalyticsPieChart metrics={metrics} />

      {/* Admin Modules Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Module 1: User Directory */}
        <Link to="/admin/users" className="group glass-card glass-card-hover p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <ExternalLink className="w-4 h-4 text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h3 className="font-bold text-slate-850 dark:text-white text-base">User Directory Manager</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">View all users, suspend accounts, and manage system roles.</p>
          </div>
        </Link>

        {/* Module 2: Officer Directory */}
        <Link to="/admin/officers" className="group glass-card glass-card-hover p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <ExternalLink className="w-4 h-4 text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h3 className="font-bold text-slate-850 dark:text-white text-base">Officer & Performance Directory</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Audit resolving officer workloads, performance scores, and transfers.</p>
          </div>
        </Link>

        {/* Module 3: Master Data Config */}
        <Link to="/admin/dashboard" className="group glass-card glass-card-hover p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <ExternalLink className="w-4 h-4 text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h3 className="font-bold text-slate-850 dark:text-white text-base">Master Data Configuration</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">CRUD operations on Categories, Departments, Priorities, and Statuses.</p>
          </div>
        </Link>

        {/* Module 4: AI request logs */}
        <Link to="/admin/ai-logs" className="group glass-card glass-card-hover p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <ExternalLink className="w-4 h-4 text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h3 className="font-bold text-slate-850 dark:text-white text-base">AI Copilot Request Log</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Inspect API request/response payloads, logs, and reanalyze complaints.</p>
          </div>
        </Link>

      </div>
    </div>
  );
}
