'use client';

import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';

export default function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { timeRange, setTimeSeriesData, setAssetAllocation, setError } = usePortfolio();

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/portfolio?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to refresh data');
      
      const data = await response.json();
      setTimeSeriesData(data.timeSeriesData);
      setAssetAllocation(data.assetAllocation);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm
        ${isRefreshing ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
    >
      <svg
        className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </button>
  );
} 