import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isLoading?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  color,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
        <div className="h-8 w-32 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center">
        <div className={`${color} rounded-lg p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <span className="ml-2 text-sm font-medium text-green-600">
                {change}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}