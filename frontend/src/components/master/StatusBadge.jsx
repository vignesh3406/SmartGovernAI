import React from 'react';

export default function StatusBadge({ status, color }) {
  // Fallback styling if color is not provided
  const badgeStyle = {
    backgroundColor: `${color}15`, // add transparency
    color: color || '#3b82f6',
    borderColor: `${color}30`,
  };

  return (
    <span 
      style={badgeStyle}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border capitalization shadow-sm"
    >
      <span 
        style={{ backgroundColor: color || '#3b82f6' }}
        className="w-1.5 h-1.5 rounded-full" 
      />
      {status}
    </span>
  );
}
