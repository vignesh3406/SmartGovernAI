import React from 'react';

export default function PriorityBadge({ priority, color }) {
  const badgeStyle = {
    backgroundColor: `${color}15`,
    color: color || '#3b82f6',
    borderColor: `${color}30`,
  };

  return (
    <span 
      style={badgeStyle}
      className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border shadow-sm"
    >
      {priority}
    </span>
  );
}
