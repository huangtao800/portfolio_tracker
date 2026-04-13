"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TimeSeriesPoint } from "../types/portfolio";
import { useHideValues } from "../context/HideValues";

function fmtCurrency(n: number): string {
  if (n >= 1_000_000)
    return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)
    return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n.toFixed(0);
}

function fmtDate(dateStr: string): string {
if (!dateStr || typeof dateStr !== "string") return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function CustomTooltip({
  active,
  payload,
  label,
  hidden,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
  hidden?: boolean;
}) {
  if (!active || !payload?.length) return null;

  const value = payload.find((p) => p.dataKey === "totalValue")?.value;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-2">{label ? fmtDate(label) : ""}</p>
      {value !== undefined && (
        <p className="text-white font-semibold">
          {hidden ? "••••••" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value)}
        </p>
      )}
    </div>
  );
}

export default function NetWorthChart({ data }: { data: TimeSeriesPoint[] }) {
  const { hidden } = useHideValues();
  if (data.length === 0) return null;

  const isSinglePoint = data.length === 1;

  // Pad the Y-axis so the line isn't cramped at the edge
  const values = data.map((d) => d.totalValue);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = isSinglePoint ? maxVal * 0.1 : (maxVal - minVal) * 0.2 || maxVal * 0.05;
  const yMin = Math.max(0, minVal - padding);
  const yMax = maxVal + padding;

  return (
    <div className="bg-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-100">Portfolio Value</h2>
        {isSinglePoint && (
          <span className="text-xs text-gray-500 italic">
            Add more CSV files to see trend
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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

          <Tooltip content={<CustomTooltip hidden={hidden} />} cursor={{ stroke: "#4b5563", strokeWidth: 1 }} />

          {/* Total value area */}
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

    </div>
  );
}
