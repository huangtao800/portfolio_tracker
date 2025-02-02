"use client";

import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { usePortfolio } from "../context/PortfolioContext";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#32a852",
  "#1b449e",
  "#b71cbd",
];

export default function AssetAllocationChart() {
  const { assetAllocation, setSelectedAssetClass, isLoading, error } =
    usePortfolio();

  if (isLoading) {
    return (
      <div className="w-full h-[400px] bg-white rounded-lg p-4 border flex items-center justify-center">
        Loading...
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
    labels: assetAllocation.map((a) => a.assetClass),
    datasets: [
      {
        data: assetAllocation.map((a) => a.percentage),
        backgroundColor: COLORS.slice(0, assetAllocation.length),
      },
    ],
  };

  return (
    <div className="w-full h-[400px] bg-white rounded-lg p-4 border">
      <Pie
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          onClick: (_, elements) => {
            if (elements.length > 0) {
              const index = elements[0].index;
              setSelectedAssetClass(assetAllocation[index].assetClass);
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.parsed;
                  const label = context.label || "";
                  return `${label}: ${value.toFixed(1)}%`;
                },
              },
            },
            datalabels: {
              color: "#fff",
              formatter: (value, context) => {
                const total = (context.dataset.data as number[]).reduce(
                  (acc, num) => acc + num,
                  0
                );
                const percentage = (value / total) * 100;
                return percentage >= 5 ? `${percentage.toFixed(1)}%` : ""; // Hide labels < 5%
              },
            },
          },
        }}
      />
    </div>
  );
}
