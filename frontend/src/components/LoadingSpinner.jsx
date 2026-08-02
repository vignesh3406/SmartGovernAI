import React from 'react';

export default function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex justify-center items-center">
      <div 
        className={`${sizes[size]} border-t-blue-600 border-r-transparent border-slate-200 dark:border-slate-700 rounded-full animate-spin`}
        role="status"
        aria-label="loading"
      />
    </div>
  );
}
