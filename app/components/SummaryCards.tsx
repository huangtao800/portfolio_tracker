"use client";

import { PortfolioSummary } from "../types/portfolio";
import { useHideValues } from "../context/HideValues";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(n.toFixed(2)) === 0 ? 0 : n);
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

interface CardProps {
  label: string;
  value: string;
  subtitle?: string;
  hidden?: boolean;
}

function Card({ label, value, subtitle, hidden }: CardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col gap-1">
      <span className="text-xs uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-2xl font-semibold text-white">
        {hidden ? <span className="tracking-widest text-gray-600">••••••</span> : value}
      </span>
      {subtitle && (
        <span className="text-xs text-gray-500">{subtitle}</span>
      )}
    </div>
  );
}

export default function SummaryCards({
  summary,
  cashAndBonds,
}: {
  summary: PortfolioSummary;
  cashAndBonds: number;
}) {
  const { hidden, toggle } = useHideValues();
  const { totalValue, totalCostBasis } = summary;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {summary.date && (
          <span className="text-sm text-gray-500">as of {summary.date}</span>
        )}
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <EyeIcon hidden={hidden} />
          {hidden ? "Show values" : "Hide values"}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card label="Net Worth"          value={fmt(totalValue)}     hidden={hidden} />
        <Card label="Cost Basis"        value={fmt(totalCostBasis)} hidden={hidden} />
        <Card label="Cash & Equivalents" value={fmt(cashAndBonds)}  hidden={hidden}
          subtitle={totalValue > 0 ? `${((cashAndBonds / totalValue) * 100).toFixed(1)}% of Net Worth` : undefined} />
      </div>
    </div>
  );
}
