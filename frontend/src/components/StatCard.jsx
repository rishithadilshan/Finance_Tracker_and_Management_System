import React from 'react';

const StatCard = ({ label, value, accent = 'text-gray-900', sub }) => (
  <div className="bg-white rounded-xl border p-4 shadow-sm">
    <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
    <div className={`text-2xl font-bold mt-1 ${accent}`}>{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
);

export default StatCard;
