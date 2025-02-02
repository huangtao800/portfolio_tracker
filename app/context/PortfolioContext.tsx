'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TimeRange, TimeSeriesData, AssetAllocation } from '../types/portfolio';

interface PortfolioContextType {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  timeSeriesData: TimeSeriesData[];
  setTimeSeriesData: (data: TimeSeriesData[]) => void;
  assetAllocation: AssetAllocation[];
  setAssetAllocation: (data: AssetAllocation[]) => void;
  selectedAssetClass: string | null;
  setSelectedAssetClass: (assetClass: string | null) => void;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('ytd');
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation[]>([]);
  const [selectedAssetClass, setSelectedAssetClass] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/portfolio?timeRange=${timeRange}`);
        if (!response.ok) throw new Error('Failed to fetch portfolio data');
        
        const data = await response.json();
        setTimeSeriesData(data.timeSeriesData);
        setAssetAllocation(data.assetAllocation);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  return (
    <PortfolioContext.Provider
      value={{
        timeRange,
        setTimeRange,
        timeSeriesData,
        setTimeSeriesData,
        assetAllocation,
        setAssetAllocation,
        selectedAssetClass,
        setSelectedAssetClass,
        isLoading,
        error,
        setError,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
} 