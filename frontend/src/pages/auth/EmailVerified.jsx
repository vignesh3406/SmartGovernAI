import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function EmailVerified() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-6">
      <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-teal-600 dark:text-teal-400" />
      </div>
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Email Verified!</h2>
      <p className="text-slate-600 dark:text-slate-350 max-w-sm mb-8">
        Your account is now activated. You can sign in using your credentials.
      </p>
      <Link
        to="/login"
        className="w-full py-3 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
      >
        Sign In
      </Link>
    </div>
  );
}
