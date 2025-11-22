import React from 'react';

const StatCard = ({ icon: Icon, label, value, trend, trendUp, color = 'primary', subtext }) => {
  const colors = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg ${colors[color]}`}><Icon size={24} /></div>
        {trend && <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>{trendUp ? '+' : ''}{trend}</span>}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};

export default StatCard;
