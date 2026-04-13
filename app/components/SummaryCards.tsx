"use client";

import { useState, useRef, useEffect } from "react";
import { PortfolioSummary, TimeSeriesPoint } from "../types/portfolio";
import { useHideValues } from "../context/HideValues";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(n.toFixed(2)) === 0 ? 0 : n);
}

function fmtPct(n: number): string {
  const rounded = parseFloat(n.toFixed(2));
  if (rounded === 0) return "0.00%";
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

// ── Period dropdown ──────────────────────────────────────────────────────────

type Period = "1d" | "1w" | "1m" | "ytd" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "1d",  label: "1D"  },
  { key: "1w",  label: "1W"  },
  { key: "1m",  label: "1M"  },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All" },
];

function PeriodDropdown({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = PERIODS.find((p) => p.key === value)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-gray-300 bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
      >
        {selected.label}
        <svg className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-16 bg-gray-700 rounded-lg shadow-lg overflow-hidden z-10">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { onChange(key); setOpen(false); }}
              className={`w-full text-left text-xs px-3 py-1.5 transition-colors ${
                key === value
                  ? "text-white bg-gray-600"
                  : "text-gray-300 hover:bg-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Return card ──────────────────────────────────────────────────────────────

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
  } else if (period === "1w") {
    refDate.setDate(refDate.getDate() - 7);
  } else {
    refDate.setDate(refDate.getDate() - 1); // 1d
  }

  const refStr = refDate.toISOString().substring(0, 10);
  const before = timeSeries.filter((p) => p.date <= refStr);
  // Fall back to earliest available snapshot if none exists before refDate
  const refPoint = before.length > 0 ? before[before.length - 1] : timeSeries[0];
  if (!refPoint) return null;

  const past = refPoint.totalValue;
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
  const positive = result && Math.abs(result.pct) >= 0.005 ? result.gain > 0 : null;
  const valueColor =
    positive === null ? "text-white" : positive ? "text-emerald-400" : "text-red-400";

  return (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-gray-400">Return</span>
        <PeriodDropdown value={period} onChange={setPeriod} />
      </div>
      <span className={`text-2xl font-semibold ${valueColor}`}>
        {result ? (
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
  cashAndBonds,
}: {
  summary: PortfolioSummary;
  timeSeries: TimeSeriesPoint[];
  cashAndBonds: number;
}) {
  const { hidden, toggle } = useHideValues();
  const { totalValue, totalCostBasis } = summary;

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
        <Card label="Total Value"  value={fmt(totalValue)}     hidden={hidden} />
        <Card label="Cost Basis"   value={fmt(totalCostBasis)} hidden={hidden} />
        <Card label="Cash & Equivalents" value={fmt(cashAndBonds)} hidden={hidden} />
        <ReturnCard summary={summary} timeSeries={timeSeries} />
      </div>
    </div>
  );
}
