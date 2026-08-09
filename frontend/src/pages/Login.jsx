import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/login/', { email, password });
      const { data } = response.data;

      if (response.data.success) {
        login(data.user, data.access, data.refresh);
        toast.success(`Welcome back, ${data.user.full_name}!`);

        // Route user to their role dashboard
        const role = data.user.role?.role_name || data.user.role;
        if (role === 'officer') navigate('/officer/dashboard');
        else if (role === 'admin') navigate('/admin/dashboard');
        else navigate('/citizen/dashboard');
      }
    } catch (error) {
      let msg = 'Invalid email or password. Please try again.';
      if (!error.response || error.code === 'ERR_NETWORK') {
        msg = 'Cannot connect to backend server. Make sure backend is running.';
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Icon + Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          Sign in to SmartGov AI
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Your civic governance dashboard awaits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1.5 tracking-wide uppercase">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Mail className="w-4.5 h-4.5" />
            </span>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full pl-10 pr-4 py-3 glass-input rounded-xl outline-none text-sm dark:text-white placeholder-slate-400"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 tracking-wide uppercase">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-500 font-semibold"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Lock className="w-4.5 h-4.5" />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full pl-10 pr-11 py-3 glass-input rounded-xl outline-none text-sm dark:text-white placeholder-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          id="login-submit"
          type="submit"
          disabled={loading}
          className="w-full py-3.5 glass-button text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Login for Demo */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-center text-slate-500 mb-4 uppercase tracking-wider font-semibold">
          Demo Quick Login
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => { setEmail('admin@example.com'); setPassword('adminpassword123'); }}
            className="py-2 px-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => { setEmail('citizen@example.com'); setPassword('citizenpassword123'); }}
            className="py-2 px-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Citizen
          </button>
          <button
            type="button"
            onClick={() => { setEmail('road@example.com'); setPassword('roadpassword123'); }}
            className="py-2 px-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Department
          </button>
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-7 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-600 hover:text-blue-500 font-bold">
          Create Account
        </Link>
      </div>
    </div>
  );
}
