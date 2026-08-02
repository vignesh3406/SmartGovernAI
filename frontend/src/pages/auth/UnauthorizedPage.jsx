import React from 'react';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950/40 rounded-full flex items-center justify-center mb-6">
        <KeyRound className="w-12 h-12 text-amber-600 dark:text-amber-450" />
      </div>
      <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2">401 - Unauthorized</h1>
      <h2 className="text-lg font-semibold text-slate-650 dark:text-slate-300 mb-4">Authentication Required</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 text-sm">
        Please sign in first to access this dashboard.
      </p>
      <Link
        to="/login"
        className="px-6 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
      >
        Sign In
      </Link>
    </div>
  );
}
