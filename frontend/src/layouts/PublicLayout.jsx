import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />
      <main className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
