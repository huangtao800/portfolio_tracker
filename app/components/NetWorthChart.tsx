"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TimeSeriesPoint } from "../types/portfolio";

function fmtCurrency(n: number): string {
  if (n >= 1_000_000)
    return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)
    return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n.toFixed(0);
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const value = payload.find((p) => p.dataKey === "totalValue")?.value;
  const cost = payload.find((p) => p.dataKey === "totalCostBasis")?.value;
  const gain = value !== undefined && cost !== undefined ? value - cost : null;
  const gainPct =
    gain !== null && cost ? ((gain / cost) * 100).toFixed(2) : null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-2">{label ? fmtDate(label) : ""}</p>
      {value !== undefined && (
        <p className="text-white font-semibold">
          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value)}
        </p>
      )}
      {cost !== undefined && (
        <p className="text-gray-400 text-xs mt-1">
          Cost basis: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cost)}
        </p>
      )}
      {gain !== null && gainPct !== null && (
        <p className={`text-xs mt-0.5 ${gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {gain >= 0 ? "+" : ""}
          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(gain)}
          {" "}({gain >= 0 ? "+" : ""}{gainPct}%)
        </p>
      )}
    </div>
  );
}

export default function NetWorthChart({ data }: { data: TimeSeriesPoint[] }) {
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
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={60}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={fmtCurrency}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#4b5563", strokeWidth: 1 }} />

          {/* Cost basis area — rendered first so it sits behind */}
          <Area
            type="monotone"
            dataKey="totalCostBasis"
            stroke="#6b7280"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            fill="url(#costGradient)"
            dot={false}
            activeDot={false}
          />

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

      {/* Legend */}
      <div className="flex gap-5 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-blue-500 rounded" />
          Total value
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 h-0"
            style={{
              borderTop: "1.5px dashed #6b7280",
            }}
          />
          Cost basis
        </span>
      </div>
    </div>
  );
}
