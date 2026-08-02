import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function EmailExpired() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const response = await api.post('/auth/resend-verification/', { email });
      if (response.data.success) {
        toast.success('Verification link resent! Please check your inbox.');
      } else {
        toast.error(response.data.message || 'Failed to resend. Please try again.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center py-6">
      <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
      </div>
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Link Expired or Invalid</h2>
      <p className="text-slate-600 dark:text-slate-350 max-w-sm mb-8 text-sm">
        This link has expired or has already been used. Please request a new verification link below.
      </p>

      <form onSubmit={handleResend} className="w-full space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            required
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none dark:text-white transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
        >
          {loading ? 'Sending...' : 'Resend Verification Link'}
        </button>
      </form>

      <div className="mt-6 text-sm">
        <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
