"use client";

import { useState } from "react";
import { PortfolioSummary, TimeSeriesPoint } from "../types/portfolio";
import { useHideValues } from "../context/HideValues";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtPct(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
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
  sub?: string;
  positive?: boolean | null;
  hidden?: boolean;
}

function Card({ label, value, sub, positive, hidden }: CardProps) {
  const valueColor =
    positive === null || positive === undefined
      ? "text-white"
      : positive
      ? "text-emerald-400"
      : "text-red-400";

  return (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col gap-1">
      <span className="text-xs uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <span className={`text-2xl font-semibold ${valueColor}`}>
        {hidden ? <span className="tracking-widest text-gray-600">••••••</span> : value}
      </span>
      {sub && (
        <span className="text-sm text-gray-400">
          {hidden ? <span className="tracking-widest text-gray-600">••••</span> : sub}
        </span>
      )}
    </div>
  );
}

// ── Return card with period selector ────────────────────────────────────────

type Period = "1w" | "1m" | "ytd" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "1w",  label: "1W"  },
  { key: "1m",  label: "1M"  },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All" },
];

function getPeriodReturn(
  timeSeries: TimeSeriesPoint[],
  summary: PortfolioSummary,
  period: Period
): { gain: number; pct: number } | null {
  if (period === "all") {
    return { gain: summary.totalGain, pct: summary.totalGainPercent };
  }

  const today = new Date();
  let refDate = new Date(today);
  if (period === "ytd") {
    refDate = new Date(today.getFullYear(), 0, 1);
  } else if (period === "1m") {
    refDate.setMonth(refDate.getMonth() - 1);
  } else {
    refDate.setDate(refDate.getDate() - 7);
  }

  const refStr = refDate.toISOString().substring(0, 10);
  const before = timeSeries.filter((p) => p.date <= refStr);
  if (before.length === 0) return null;

  const past = before[before.length - 1].totalValue;
  if (past === 0) return null;

  const gain = summary.totalValue - past;
  return { gain, pct: (gain / past) * 100 };
}

function ReturnCard({
  summary,
  timeSeries,
}: {
  summary: PortfolioSummary;
  timeSeries: TimeSeriesPoint[];
}) {
  const { hidden } = useHideValues();
  const [period, setPeriod] = useState<Period>("all");
  const result = getPeriodReturn(timeSeries, summary, period);
  const positive = result ? result.gain >= 0 : null;
  const valueColor =
    positive === null ? "text-white" : positive ? "text-emerald-400" : "text-red-400";

  return (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-gray-400">Return</span>
        <div className="flex gap-0.5">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                period === key
                  ? "bg-gray-600 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <span className={`text-2xl font-semibold ${valueColor}`}>
        {hidden ? (
          <span className="tracking-widest text-gray-600">••••••</span>
        ) : result ? (
          fmtPct(result.pct)
        ) : (
          <span className="text-base text-gray-500">No data</span>
        )}
      </span>
      {result && (
        <span className="text-sm text-gray-400">
          {hidden ? (
            <span className="tracking-widest text-gray-600">••••</span>
          ) : (
            (result.gain >= 0 ? "+" : "") + fmt(result.gain)
          )}
        </span>
      )}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function SummaryCards({
  summary,
  timeSeries,
}: {
  summary: PortfolioSummary;
  timeSeries: TimeSeriesPoint[];
}) {
  const { hidden, toggle } = useHideValues();
  const { totalValue, totalCostBasis, totalGain, totalGainPercent } = summary;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <EyeIcon hidden={hidden} />
          {hidden ? "Show values" : "Hide values"}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Total Value" value={fmt(totalValue)} hidden={hidden} />
        <Card label="Cost Basis" value={fmt(totalCostBasis)} hidden={hidden} />
        <Card
          label="Total Gain"
          value={fmt(totalGain)}
          sub={fmtPct(totalGainPercent)}
          positive={totalGain >= 0}
          hidden={hidden}
        />
        <ReturnCard summary={summary} timeSeries={timeSeries} />
      </div>
    </div>
  );
}
