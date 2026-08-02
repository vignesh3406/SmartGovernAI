import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Award, Briefcase, Star, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ManageOfficers() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  const loadData = async () => {
    try {
      const [resUsers, resDepts] = await Promise.all([
        api.get('/admin/users/'),
        api.get('/departments/')
      ]);
      // Filter for officers only
      const allUsers = resUsers.data.data || resUsers.data;
      const officerUsers = allUsers.filter((u) => u.role === 'officer');
      setOfficers(officerUsers);
      setDepartments(resDepts.data.data || resDepts.data);
    } catch (err) {
      toast.error('Failed to load officers directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Award className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Officer Operations Roster</h1>
          <p className="text-sm text-slate-500 mt-1">Audit active field operations workloads, transfer department routing, and track ratings.</p>
        </div>
      </div>

      {/* Officers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {officers.map((off) => (
          <div key={off.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white">{off.full_name}</h3>
                <span className="text-xs text-slate-400 mt-0.5">{off.email}</span>
              </div>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-755 border border-blue-200 px-2 py-0.5 rounded-md">
                Field Officer
              </span>
            </div>

            {/* Simulated/Fetched operational performance stats */}
            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-850 text-xs font-semibold text-slate-600">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl text-center space-y-1">
                <Star className="w-4 h-4 text-amber-500 mx-auto" />
                <div className="text-slate-800 dark:text-white">4.8 / 5</div>
                <div className="text-[9px] text-slate-400 uppercase tracking-wider">Citizen Rating</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl text-center space-y-1">
                <Clock className="w-4 h-4 text-blue-500 mx-auto" />
                <div className="text-slate-800 dark:text-white">4.2 hrs</div>
                <div className="text-[9px] text-slate-400 uppercase tracking-wider">Resolution</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl text-center space-y-1">
                <Briefcase className="w-4 h-4 text-emerald-500 mx-auto" />
                <div className="text-slate-800 dark:text-white">Active</div>
                <div className="text-[9px] text-slate-400 uppercase tracking-wider">Workload</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
