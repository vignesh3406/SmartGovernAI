import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Mail, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password/', { email });
      if (response.data.success) {
        setSent(true);
        toast.success('Password reset link sent!');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-teal-600 dark:text-teal-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Check Your Email</h2>
        <p className="text-slate-600 dark:text-slate-350 max-w-sm mx-auto mb-8 text-sm">
          If an account matches <span className="font-semibold">{email}</span>, we sent a password reset link. Please check your inbox.
        </p>
        <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-slate-850 dark:text-white mb-2">Forgot Password?</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          No worries. Enter your email and we'll send you a recovery link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Mail className="w-5 h-5" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
        >
          {loading ? 'Sending link...' : 'Send Recovery Link'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
