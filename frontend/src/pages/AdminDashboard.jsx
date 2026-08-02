import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow border border-slate-200/50 dark:border-slate-700/50">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Admin Control Center</h1>
      <p className="text-slate-650 dark:text-slate-350">
        Manage system users, register officers, configure departments, and analyze performance reports.
      </p>
    </div>
  );
}
