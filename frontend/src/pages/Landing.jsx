import React from 'react';

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow border border-slate-200/50 dark:border-slate-700/50">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Welcome to SmartGov AI</h1>
      <p className="text-slate-600 dark:text-slate-300">
        Intelligent Public Grievance Redressal & Civic Management System
      </p>
    </div>
  );
}
