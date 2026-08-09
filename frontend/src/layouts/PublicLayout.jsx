import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function PublicLayout() {
  return (
    <div className="min-h-screen ambient-bg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200 relative overflow-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col justify-center items-center p-4 z-10">
        <div className="w-full max-w-md glass-card p-8 rounded-3xl shadow-2xl relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
