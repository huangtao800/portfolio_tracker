'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from "chartjs-plugin-datalabels";
import { usePortfolio } from '../context/PortfolioContext';
import LoadingSpinner from './LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

export default function NetWorthChart() {
  const { timeSeriesData, isLoading, error } = usePortfolio();

  if (isLoading) {
    return (
      <div className="w-full h-[400px] bg-white p-4 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[400px] bg-white rounded-lg p-4 border flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  const data = {
    labels: timeSeriesData.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Net Worth',
        data: timeSeriesData.map(d => d.netWorth),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="w-full h-[400px] bg-white rounded-lg p-4 border">
      <Line 
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: (value) => 
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(value as number),
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(context.parsed.y);
                },
              },
            },
            datalabels: {
              display: false, // Disable data labels on slices
            },
          },
        }}
      />
    </div>
  );
} 