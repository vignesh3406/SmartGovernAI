import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Bell, X, CheckSquare, Trash2, MailOpen } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/');
      if (res.data.success) {
        toast.success('All notifications marked as read.');
        loadNotifications();
      }
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/`);
      if (res.data.success) {
        loadNotifications();
      }
    } catch (err) {
      toast.error('Operation failed.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-800 h-full shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col p-6 space-y-6 animate-in slide-in-from-right duration-150">
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-850 dark:text-white">Notification Feed</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={handleMarkAllRead} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500" title="Mark all read">
              <CheckSquare className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <MailOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-xs">No updates to report right now.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => !notif.is_read && handleMarkSingleRead(notif.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1.5
                  ${notif.is_read 
                    ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-750/50 opacity-60' 
                    : 'bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30'
                  }
                `}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold text-slate-800 dark:text-white text-xs leading-normal">
                    {notif.title}
                  </span>
                  {!notif.is_read && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {notif.message}
                </p>
                <div className="text-[9px] text-slate-400">
                  {new Date(notif.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
