'use client';

import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { calculatePerformance } from '../utils/performance';

export default function PerformanceMetrics() {
  const { timeSeriesData, timeRange, isLoading } = usePortfolio();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-100 h-16 rounded"></div>;
  }

  const metrics = calculatePerformance(timeSeriesData);
  const isPositive = metrics.totalReturn >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm text-gray-500 font-medium">Total Return</h3>
        <p className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(metrics.totalReturn)}
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm text-gray-500 font-medium">Return %</h3>
        <p className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {metrics.percentageReturn.toFixed(2)}%
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm text-gray-500 font-medium">Start Value</h3>
        <p className="text-lg font-semibold">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(metrics.startValue)}
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm text-gray-500 font-medium">Current Value</h3>
        <p className="text-lg font-semibold">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(metrics.endValue)}
        </p>
      </div>
    </div>
  );
} 