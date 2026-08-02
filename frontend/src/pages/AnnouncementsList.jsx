import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Megaphone, Calendar, User, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AnnouncementsList() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Admin create state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const loadAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/');
      setAnnouncements(res.data.data || res.data);
    } catch (err) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/announcements/', {
        title,
        content,
        target_role: target
      });
      if (res.data.success) {
        toast.success('Announcement broadcasted successfully!');
        setTitle('');
        setContent('');
        setShowForm(false);
        loadAnnouncements();
      }
    } catch (err) {
      toast.error('Failed to send broadcast announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = user?.role?.role_name === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-blue-600 animate-bounce" />
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Announcements</h1>
            <p className="text-sm text-slate-500 mt-1">Official bulletins, alerts, and city updates issued by municipal administrators.</p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" /> Broadcast Announcement
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 font-semibold text-xs text-slate-600">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">New Announcement Details</h3>

          <div>
            <label className="block text-slate-500 mb-1">Announcement Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Major Water Pipeline Maintenance Alerts"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Content Details</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Write announcement body message here..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Target Audience</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Everyone</option>
              <option value="citizen">Citizens Only</option>
              <option value="officer">Officers Only</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50"
          >
            {submitting ? 'Sending Broadcast...' : 'Broadcast Announcement'}
          </button>
        </form>
      )}

      {/* Renders Feed List */}
      <div className="space-y-6">
        {announcements.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200/50 text-center text-slate-500">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-755 dark:text-slate-350">No announcements posted</h3>
            <p className="text-xs text-slate-400 mt-1">Official municipal broadcasts and maintenance alerts will appear here.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{ann.title}</h3>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                  Target: {ann.target_role}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </p>
              <div className="flex gap-4 items-center text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Posted by {ann.sender_name}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(ann.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
