import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../components/master/StatusBadge';
import PriorityBadge from '../components/master/PriorityBadge';
import { Search, SlidersHorizontal, CheckSquare, CheckCircle2, RefreshCw, Star, Clock, Award, Eye, Navigation } from 'lucide-react';

export default function OfficerDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    try {
      const resDash = await api.get('/officer/dashboard/');
      setMetrics(resDash.data.data);

      const resList = await api.get('/officer/assigned/');
      setAssignments(resList.data.data);
    } catch (err) {
      toast.error('Failed to load officer dashboard worklist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAccept = async (complaintId) => {
    try {
      const res = await api.put(`/officer/status/${complaintId}/`, { status: 'Accepted' });
      if (res.data.success) {
        toast.success('Assignment accepted!');
        loadData();
      }
    } catch (err) {
      toast.error('Failed to accept assignment.');
    }
  };

  const handleCompleteWork = async (complaintId) => {
    try {
      const res = await api.put(`/officer/status/${complaintId}/`, {
        status: 'Resolved',
        notes: 'Work marked completed by assigned officer. Issue resolved.'
      });
      if (res.data.success) {
        toast.success('Work completed! Grievance marked as Resolved for citizen.');
        loadData();
      }
    } catch (err) {
      toast.error('Failed to update status to completed.');
    }
  };

  const filtered = assignments.filter((item) => {
    const complaint = item.complaint_detail || item;
    const matchesSearch =
      complaint.title?.toLowerCase().includes(search.toLowerCase()) ||
      complaint.complaint_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const counts = metrics?.counts || { pending: 0, accepted: 0, in_progress: 0, completed: 0, escalated: 0, total: 0 };
  const perf = metrics?.performance || { completed_complaints: 0, average_resolution_time: 0.0, rating_average: 5.0, performance_score: 100.0 };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Officer Work Center</h1>
          <p className="text-blue-100 text-sm mt-1">Manage, route, and resolve civic complaints assigned to your department.</p>
        </div>
        
        {/* Performance Score Badge */}
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
          <Award className="w-8 h-8 text-yellow-300" />
          <div>
            <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Performance Score</div>
            <div className="text-xl font-black">{perf.performance_score.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm text-center space-y-1">
          <div className="text-2xl font-black text-slate-800 dark:text-white">{counts.total}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Assignments</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm text-center space-y-1">
          <div className="text-2xl font-black text-amber-500">{counts.pending}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Acceptance</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm text-center space-y-1">
          <div className="text-2xl font-black text-blue-500">{counts.accepted + counts.in_progress}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Workload</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm text-center space-y-1">
          <div className="text-2xl font-black text-emerald-500">{counts.completed}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved Tickets</div>
        </div>
      </div>

      {/* Stats Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">Average Resolution Speed</h4>
            <p className="text-xs text-slate-450">Typical time duration from assignment to full resolution.</p>
          </div>
          <div className="flex items-center gap-2 text-2xl font-black text-slate-800 dark:text-white">
            <Clock className="w-6 h-6 text-blue-500" /> {perf.average_resolution_time.toFixed(1)} hrs
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">Citizen Review Ratings</h4>
            <p className="text-xs text-slate-455">Average feedback stars given by citizens for resolved work.</p>
          </div>
          <div className="flex items-center gap-2 text-2xl font-black text-amber-500">
            <Star className="w-6 h-6 fill-current" /> {perf.rating_average.toFixed(1)} / 5.0
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search by Grievance ID or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm dark:text-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-48 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Assigned">Assigned (New)</option>
          <option value="Accepted">Accepted</option>
          <option value="Travelling">Travelling</option>
          <option value="Arrived">Arrived</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Escalated">Escalated</option>
        </select>
      </div>

      {/* Worklist Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-350">No assignments matching criteria</h3>
            <p className="text-sm text-slate-400 mt-1">Assignments will appear here once civic grievances are routed to your department queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((item) => {
              const complaint = item.complaint_detail || item;
              return (
                <div key={item.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">{complaint.complaint_number}</span>
                      <span className="text-xs text-slate-400">• Assigned {new Date(item.assigned_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-base">{complaint.title}</h4>
                    <p className="text-xs text-slate-450 truncate max-w-lg">{complaint.description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <StatusBadge status={item.status} />
                    
                    {item.status === 'Assigned' && (
                      <button
                        onClick={() => handleAccept(complaint.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all"
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> Accept Work
                      </button>
                    )}

                    {['Accepted', 'Travelling', 'Arrived', 'In Progress'].includes(item.status) && (
                      <button
                        onClick={() => handleCompleteWork(complaint.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all"
                        title="Mark Work Completed (Issue Resolved for Citizen)"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Work Completed
                      </button>
                    )}

                    <Link
                      to={`/complaints/${complaint.id}`}
                      className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-605 hover:bg-slate-100"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
