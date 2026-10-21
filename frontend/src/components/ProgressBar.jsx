import React from 'react';

const ProgressBar = ({ percent, color = 'bg-brand-500' }) => {
  const clamped = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
};

export default ProgressBar;
