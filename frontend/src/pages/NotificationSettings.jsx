import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Settings, Bell, Mail, ToggleLeft, ToggleRight } from 'lucide-react';

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await api.get('/preferences/');
        setPreferences(res.data.data);
      } catch (err) {
        toast.error('Failed to load notification settings.');
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const handleToggle = async (key, currentValue) => {
    try {
      const res = await api.put('/preferences/', { [key]: !currentValue });
      if (res.data.success) {
        setPreferences(res.data.data);
        toast.success('Notification settings saved.');
      }
    } catch (err) {
      toast.error('Failed to save settings.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Communication Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure opt-in channels to choose how you want to be notified about dashboard updates.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-6 divide-y divide-slate-100 dark:divide-slate-800">
        
        {/* Email notifications toggle */}
        <div className="py-5 flex justify-between items-center gap-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-805 dark:text-white">Email Alerts</h3>
              <p className="text-[11px] text-slate-450 mt-0.5">Receive transactional mail regarding your ticket assignment and updates.</p>
            </div>
          </div>
          <button onClick={() => handleToggle('email_notifications', preferences.email_notifications)}>
            {preferences.email_notifications ? (
              <ToggleRight className="w-10 h-10 text-blue-600 cursor-pointer" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-slate-350 cursor-pointer" />
            )}
          </button>
        </div>

        {/* In-app notifications toggle */}
        <div className="py-5 flex justify-between items-center gap-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-805 dark:text-white">In-App Feed Notifications</h3>
              <p className="text-[11px] text-slate-455 mt-0.5">Show notifications logs in your header dashboard notification center drawer.</p>
            </div>
          </div>
          <button onClick={() => handleToggle('in_app_notifications', preferences.in_app_notifications)}>
            {preferences.in_app_notifications ? (
              <ToggleRight className="w-10 h-10 text-blue-600 cursor-pointer" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-slate-350 cursor-pointer" />
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
