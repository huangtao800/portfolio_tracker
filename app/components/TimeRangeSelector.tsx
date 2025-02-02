'use client';

import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { TimeRange } from '../types/portfolio';

const timeRanges: { label: string; value: TimeRange }[] = [
  { label: 'YTD', value: 'ytd' },
  { label: '30 Days', value: '30d' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
  { label: '3 Years', value: '3y' },
  { label: '5 Years', value: '5y' },
  { label: 'All Time', value: 'all' },
];

export default function TimeRangeSelector() {
  const { timeRange, setTimeRange } = usePortfolio();

  return (
    <select 
      className="border rounded-md px-3 py-1.5"
      value={timeRange}
      onChange={(e) => setTimeRange(e.target.value as TimeRange)}
    >
      {timeRanges.map((range) => (
        <option key={range.value} value={range.value}>
          {range.label}
        </option>
      ))}
    </select>
  );
} 