import React from 'react';
import NetWorthChart from '@/components/NetWorthChart';
import AssetAllocationChart from '@/components/AssetAllocationChart';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import HoldingsList from '@/components/HoldingsList';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PerformanceMetrics from '@/components/PerformanceMetrics';
import RefreshButton from '@/components/RefreshButton';

export default function Page() {
  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Portfolio Dashboard</h1>
        <RefreshButton />
      </div>
      
      <ErrorBoundary>
        <div className="mb-8">
          <PerformanceMetrics />
        </div>

        <div className="mb-8 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Net Worth History</h2>
            <TimeRangeSelector />
          </div>
          <NetWorthChart />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Asset Allocation</h2>
            </div>
            <AssetAllocationChart />
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Holdings</h2>
            </div>
            <HoldingsList />
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}