"use client";

import { useState, useRef, useEffect } from "react";
import {
  AreaChart,
  Area,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TimeSeriesPoint } from "../types/portfolio";
import { useHideValues } from "../context/HideValues";

// ── Period filter ────────────────────────────────────────────────────────────

type Period = "1w" | "1m" | "ytd" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "1w",  label: "1W"  },
  { key: "1m",  label: "1M"  },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All" },
];

function filterByPeriod(data: TimeSeriesPoint[], period: Period): TimeSeriesPoint[] {
  if (period === "all" || data.length === 0) return data;

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
  const filtered = data.filter((p) => p.date >= refStr);

  // Include one point before the window for a clean line start
  if (filtered.length === 0 || filtered[0].date > refStr) {
    const before = data.filter((p) => p.date < refStr);
    if (before.length > 0) return [before[before.length - 1], ...filtered];
  }
  return filtered.length > 0 ? filtered : data;
}

// ── Dropdown ─────────────────────────────────────────────────────────────────

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
                key === value ? "text-white bg-gray-600" : "text-gray-300 hover:bg-gray-600"
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n.toFixed(0);
}

function fmtDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().substring(0, 10);
}

function nearestVooPrice(cache: Record<string, number>, dateStr: string): number | null {
  for (let i = 0; i <= 7; i++) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() - i);
    const key = d.toISOString().substring(0, 10);
    if (cache[key] !== undefined) return cache[key];
  }
  return null;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function CustomTooltip({
  active, payload, label, hidden, startValue,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
  hidden?: boolean;
  startValue?: number;
}) {
  if (!active || !payload?.length) return null;

  const value     = payload.find((p) => p.dataKey === "totalValue")?.value;
  const benchmark = payload.find((p) => p.dataKey === "benchmarkValue")?.value;

  const gain    = value !== undefined && startValue !== undefined ? value - startValue : null;
  const gainPct = gain !== null && startValue ? (gain / startValue) * 100 : null;
  const isZero  = gainPct !== null && Math.abs(gainPct) < 0.005;
  const gainColor = isZero ? "text-gray-400" : gain !== null && gain >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-2">{label ? fmtDate(label) : ""}</p>
      {value !== undefined && (
        <p className="text-white font-semibold">{hidden ? "••••••" : usd(value)}</p>
      )}
      {gain !== null && gainPct !== null && (
        <p className={`text-xs mt-0.5 ${gainColor}`}>
          {hidden ? fmtPct(gainPct) : `${fmtGain(gain)}  ${fmtPct(gainPct)}`}
        </p>
      )}
      {benchmark !== undefined && (
        <p className="text-gray-400 text-xs mt-1">S&amp;P 500: {hidden ? "••••••" : usd(benchmark)}</p>
      )}
    </div>
  );
}

// ── Chart ─────────────────────────────────────────────────────────────────────

function fmtGain(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs >= 1_000_000
    ? "$" + (abs / 1_000_000).toFixed(2) + "M"
    : abs >= 1_000
    ? "$" + (abs / 1_000).toFixed(1) + "K"
    : "$" + abs.toFixed(0);
  return (n >= 0 ? "+" : "-") + formatted;
}

function fmtPct(n: number): string {
  const rounded = parseFloat(n.toFixed(2));
  if (rounded === 0) return "0.00%";
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

export default function NetWorthChart({ data }: { data: TimeSeriesPoint[] }) {
  const { hidden } = useHideValues();
  const [period, setPeriod] = useState<Period>("1w");
  const [vooCache, setVooCache] = useState<Record<string, number>>({});
  const earliestFetchedRef = useRef<string | null>(null);

  const filtered      = data.length > 0 ? filterByPeriod(data, period) : [];
  const periodStartDate = filtered.length > 0 ? filtered[0].date : "";

  // Lazily fetch VOO prices when the period start date requires earlier data
  useEffect(() => {
    if (!periodStartDate) return;

    const neededStart = offsetDate(periodStartDate, -7);
    if (earliestFetchedRef.current !== null && neededStart >= earliestFetchedRef.current) return;

    const fetchEnd = offsetDate(new Date().toISOString().substring(0, 10), 5);

    fetch(`/api/benchmark?period1=${neededStart}&period2=${fetchEnd}`)
      .then((r) => r.json())
      .then((prices: Record<string, number>) => {
        setVooCache((prev) => ({ ...prev, ...prices }));
        if (earliestFetchedRef.current === null || neededStart < earliestFetchedRef.current) {
          earliestFetchedRef.current = neededStart;
        }
      })
      .catch(() => {});
  }, [periodStartDate]);

  if (data.length === 0) return null;

  const isSinglePoint = filtered.length === 1;
  const startValue    = filtered[0].totalValue;
  const currentValue  = filtered[filtered.length - 1].totalValue;
  const gain          = currentValue - startValue;
  const gainPct       = startValue > 0 ? (gain / startValue) * 100 : 0;
  const isZero        = Math.abs(gainPct) < 0.005;
  const gainColor     = isZero ? "text-gray-400" : gain >= 0 ? "text-emerald-400" : "text-red-400";

  // Normalize VOO prices to period start portfolio value
  const periodStartVOO = nearestVooPrice(vooCache, periodStartDate);
  const chartData = filtered.map((p) => {
    const vooPrice = periodStartVOO != null ? nearestVooPrice(vooCache, p.date) : null;
    return {
      ...p,
      benchmarkValue: vooPrice != null && periodStartVOO != null
        ? startValue * (vooPrice / periodStartVOO)
        : undefined,
    };
  });

  const allValues = [
    ...chartData.map((d) => d.totalValue),
    ...chartData.flatMap((d) => d.benchmarkValue != null ? [d.benchmarkValue] : []),
  ];
  const minVal  = Math.min(...allValues);
  const maxVal  = Math.max(...allValues);
  const padding = isSinglePoint ? maxVal * 0.1 : (maxVal - minVal) * 0.2 || maxVal * 0.05;
  const yMin    = Math.max(0, minVal - padding);
  const yMax    = maxVal + padding;

  return (
    <div className="bg-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-100">Net Worth</h2>
          <p className={`text-sm mt-0.5 ${gainColor}`}>
            {hidden ? fmtPct(gainPct) : `${fmtGain(gain)}  ${fmtPct(gainPct)}`}
          </p>
        </div>
        <PeriodDropdown value={period} onChange={setPeriod} />
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />

          <XAxis
            dataKey="date"
            type="category"
            interval="preserveStartEnd"
            tickFormatter={fmtDate}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={hidden ? () => "" : fmtCurrency}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={hidden ? 16 : 60}
          />

          <Tooltip content={<CustomTooltip hidden={hidden} startValue={startValue} />} cursor={{ stroke: "#4b5563", strokeWidth: 1 }} />

          {/* Period start baseline */}
          <ReferenceLine y={startValue} stroke="#4b5563" strokeDasharray="4 3" strokeWidth={1} />

          {/* S&P 500 benchmark */}
          <Line
            type="monotone"
            dataKey="benchmarkValue"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
          />

          {/* Portfolio value area */}
          <Area
            type="monotone"
            dataKey="totalValue"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#valueGradient)"
            dot={isSinglePoint ? { r: 5, fill: "#3b82f6", strokeWidth: 0 } : false}
            activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex gap-5 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-blue-500 rounded" />
          Portfolio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0" style={{ borderTop: "1.5px dashed #f59e0b" }} />
          S&amp;P 500
        </span>
      </div>
    </div>
  );
}
