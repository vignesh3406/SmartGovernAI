import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getCategories } from '../services/complaints';
import toast from 'react-hot-toast';
import StatusBadge from '../components/master/StatusBadge';
import PriorityBadge from '../components/master/PriorityBadge';
import { PlusCircle, Search, SlidersHorizontal, MapPin, Eye, FileText } from 'lucide-react';

export default function CitizenDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadData = async () => {
    try {
      const [compRes, catRes] = await Promise.all([
        api.get('/complaints/'),
        getCategories()
      ]);
      setComplaints(compRes.data.data || compRes.data);
      setCategories(catRes.data || catRes);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch = 
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.complaint_number.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter ? c.status_detail?.status === statusFilter : true;
    const matchesCategory = categoryFilter ? c.category_detail?.id === categoryFilter : true;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate quick stats
  const totalTickets = complaints.length;
  const pendingTickets = complaints.filter(c => c.status_detail?.status === 'Pending').length;
  const inProgressTickets = complaints.filter(c => c.status_detail?.status === 'In Progress').length;
  const resolvedTickets = complaints.filter(c => c.status_detail?.status === 'Resolved' || c.status_detail?.status === 'Closed').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex justify-between items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-500/10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Citizen Service Hub</h1>
          <p className="text-blue-100 text-sm mt-1">Submit, monitor, and verify resolution of your civic grievances.</p>
        </div>
        <Link 
          to="/complaints/new" 
          className="flex items-center gap-2 px-5 py-3 bg-white text-blue-650 font-bold text-sm rounded-xl shadow-md hover:scale-105 transition-transform"
        >
          <PlusCircle className="w-5 h-5" /> File Grievance
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalTickets}</div>
          <div className="text-xs text-slate-450 mt-0.5">Total Grievances</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm text-center">
          <div className="text-2xl font-bold text-amber-500">{pendingTickets}</div>
          <div className="text-xs text-slate-450 mt-0.5">Awaiting Review</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-500">{inProgressTickets}</div>
          <div className="text-xs text-slate-450 mt-0.5">In Progress</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-500">{resolvedTickets}</div>
          <div className="text-xs text-slate-450 mt-0.5">Resolved Issues</div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search by ID or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm dark:text-white"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.category_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
        {filteredComplaints.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-350">No complaints registered</h3>
            <p className="text-sm text-slate-400 mt-1">If you have any civic issues to report, file a new grievance.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredComplaints.map((c) => (
              <div key={c.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">{c.complaint_number}</span>
                    <span className="text-xs text-slate-400">• {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-base">{c.title}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span className="truncate max-w-sm">{c.address || 'Location registered'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                  <StatusBadge status={c.status_detail?.status} color={c.status_detail?.color} />
                  <PriorityBadge priority={c.priority_detail?.priority} color={c.priority_detail?.color} />
                  <Link 
                    to={`/complaints/${c.id}`}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 hover:text-blue-650"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
