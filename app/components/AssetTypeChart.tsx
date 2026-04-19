"use client";

import { useState } from "react";
import { AggregatedHolding } from "../types/portfolio";
import { useHideValues } from "../context/HideValues";

export type AssetCategory = string;

const CATEGORY_COLORS: Record<string, string> = {
  "US Large Cap": "#3b82f6",
  "US Small Cap": "#a855f7",
  "US Total Market": "#06b6d4",
  "Bonds": "#f59e0b",
  "Cash & Short-term": "#10b981",
  "Other": "#6b7280",
};

const R = 70;
const CIRC = 2 * Math.PI * R;
const STROKE_WIDTH = 26;
const GAP_FRAC = 1.5 / 360;

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n: number | null): string {
  if (n === null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

function buildSegments(
  aggregated: AggregatedHolding[],
  totalValue: number,
  categoryMap: Record<string, AssetCategory>
): { category: AssetCategory; value: number; pct: number }[] {
  const map = new Map<AssetCategory, number>();
  for (const h of aggregated) {
    const cat = categoryMap[h.ticker] ?? "Other";
    map.set(cat, (map.get(cat) ?? 0) + h.totalValue);
  }
  return Array.from(map.entries())
    .map(([category, value]) => ({ category, value, pct: value / totalValue }))
    .sort((a, b) => b.value - a.value);
}

export default function AssetTypeChart({
  aggregated,
  totalValue,
  categoryMap,
}: {
  aggregated: AggregatedHolding[];
  totalValue: number;
  categoryMap: Record<string, AssetCategory>;
}) {
  const { hidden } = useHideValues();
  const [selected, setSelected] = useState<AssetCategory | null>(null);
  const segments = buildSegments(aggregated, totalValue, categoryMap);

  const selectedHoldings = selected
    ? aggregated.filter((h) => (categoryMap[h.ticker] ?? "Other") === selected)
    : [];

  const selectedSeg = segments.find((s) => s.category === selected);

  function toggle(cat: AssetCategory) {
    setSelected((prev) => (prev === cat ? null : cat));
  }

  let accumulated = 0;

  return (
    <div className="bg-gray-800 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-100">Asset Allocation</h2>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Ring */}
        <div className="flex-shrink-0">
          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            style={{ transform: "rotate(-90deg)" }}
          >
            {segments.map((seg) => {
              const isSelected = selected === seg.category;
              const dimmed = selected !== null && !isSelected;
              const dashLength = Math.max(0, (seg.pct - GAP_FRAC) * CIRC);
              const offset = -accumulated * CIRC;
              accumulated += seg.pct;
              return (
                <circle
                  key={seg.category}
                  cx={90}
                  cy={90}
                  r={R}
                  fill="none"
                  stroke={CATEGORY_COLORS[seg.category]}
                  strokeWidth={isSelected ? STROKE_WIDTH + 6 : STROKE_WIDTH}
                  strokeDasharray={`${dashLength} ${CIRC}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                  opacity={dimmed ? 0.25 : 1}
                  style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                  onClick={() => toggle(seg.category)}
                />
              );
            })}
            {/* Center text — counter-rotate to stay upright */}
            <g style={{ transform: "rotate(90deg)", transformOrigin: "90px 90px" }}>
              {selected && selectedSeg ? (
                <>
                  <text x={90} y={82} textAnchor="middle" fill="#f3f4f6" fontSize="10" fontWeight="600">
                    {selected}
                  </text>
                  <text x={90} y={96} textAnchor="middle" fill="#9ca3af" fontSize="9">
                    {(selectedSeg.pct * 100).toFixed(1)}%
                  </text>
                  <text x={90} y={108} textAnchor="middle" fill="#9ca3af" fontSize="9">
                    {hidden ? "••••" : fmt(selectedSeg.value)}
                  </text>
                </>
              ) : (
                <>
                  <text x={90} y={87} textAnchor="middle" fill="#f3f4f6" fontSize="11" fontWeight="600">
                    Total
                  </text>
                  <text x={90} y={100} textAnchor="middle" fill="#9ca3af" fontSize="9">
                    {hidden ? "••••" : fmt(totalValue)}
                  </text>
                </>
              )}
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 w-full">
          {segments.map((seg) => {
            const isSelected = selected === seg.category;
            const dimmed = selected !== null && !isSelected;
            return (
              <button
                key={seg.category}
                onClick={() => toggle(seg.category)}
                className={`flex items-center gap-3 text-left rounded-lg px-2 py-1 -mx-2 transition-all ${
                  isSelected
                    ? "bg-gray-700"
                    : "hover:bg-gray-700/50"
                } ${dimmed ? "opacity-40" : ""}`}
              >
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[seg.category] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-gray-200 font-medium">
                      {seg.category}
                    </span>
                    <span className="text-sm font-mono text-gray-300 flex-shrink-0">
                      {hidden ? "••••" : fmt(seg.value)}
                    </span>
                  </div>
                  <div className="mt-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${seg.pct * 100}%`,
                        backgroundColor: CATEGORY_COLORS[seg.category],
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {(seg.pct * 100).toFixed(1)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded holdings for selected category */}
      {selected && selectedHoldings.length > 0 && (
        <div
          className="border-t pt-4 mt-2"
          style={{ borderColor: CATEGORY_COLORS[selected] + "40" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: CATEGORY_COLORS[selected] }}
          >
            {selected}
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-500 border-b border-gray-700">
                <th className="text-left py-2 px-1">Ticker</th>
                <th className="text-left py-2 px-1 hidden sm:table-cell">Name</th>
                <th className="text-right py-2 px-1">Value</th>
                <th className="text-right py-2 px-1">Alloc</th>
                <th className="text-right py-2 px-1">Gain</th>
              </tr>
            </thead>
            <tbody>
              {selectedHoldings.map((h) => {
                const gainColor =
                  h.gainPercent === null
                    ? "text-gray-500"
                    : h.gainPercent >= 0
                    ? "text-emerald-400"
                    : "text-red-400";
                return (
                  <tr
                    key={h.ticker}
                    className="border-b border-gray-700/50 last:border-0"
                  >
                    <td className="py-2 px-1 font-semibold text-blue-300">
                      {h.ticker}
                    </td>
                    <td className="py-2 px-1 text-gray-400 text-xs hidden sm:table-cell max-w-[160px] truncate">
                      {h.holdingName}
                    </td>
                    <td className="py-2 px-1 text-right font-mono text-gray-200">
                      {hidden ? <span className="tracking-widest text-gray-600">••••</span> : fmt(h.totalValue)}
                    </td>
                    <td className="py-2 px-1 text-right text-gray-400">
                      {((h.totalValue / totalValue) * 100).toFixed(1)}%
                    </td>
                    <td className={`py-2 px-1 text-right ${gainColor}`}>
                      {fmtPct(h.gainPercent)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
