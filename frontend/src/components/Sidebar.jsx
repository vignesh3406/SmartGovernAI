import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, Home, Shield, FileText, Settings, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();
  
  const roleName = user?.role?.role_name || user?.role;
  
  const navItems = [
    { name: 'Profile', path: '/profile', icon: User },
  ];

  if (roleName === 'admin') {
    navItems.unshift({ name: 'Admin Dashboard', path: '/admin/dashboard', icon: Home });
    navItems.push({ name: 'Admin Control', path: '/admin-panel', icon: Shield });
  } else if (roleName === 'officer') {
    navItems.unshift({ name: 'Officer Dashboard', path: '/officer/dashboard', icon: Home });
  } else {
    navItems.unshift({ name: 'Citizen Dashboard', path: '/citizen/dashboard', icon: Home });
  }

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 
        z-50 lg:z-30 lg:static flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700 lg:hidden">
          <span className="font-bold text-lg text-slate-800 dark:text-white">Navigation</span>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Quick View */}
        {user && (
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-white text-base truncate">{user.full_name}</h4>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full capitalize">
              {roleName}
            </span>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'}
                `}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
