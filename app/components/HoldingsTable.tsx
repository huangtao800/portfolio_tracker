"use client";

import { useState } from "react";
import { AggregatedHolding } from "../types/portfolio";

type SortKey = "ticker" | "totalShares" | "totalValue" | "alloc" | "costBasis" | "gainPercent" | "return1D" | "return1M" | "return6M";
type SortDir = "asc" | "desc";

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

function PctCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-500">—</span>;
  const color = value > 0 ? "text-emerald-400" : value < 0 ? "text-red-400" : "text-gray-400";
  return <span className={color}>{fmtPct(value)}</span>;
}

function sortRows(rows: AggregatedHolding[], key: SortKey, dir: SortDir, totalValue: number): AggregatedHolding[] {
  return [...rows].sort((a, b) => {
    let av: number | string;
    let bv: number | string;
    switch (key) {
      case "ticker":       av = a.ticker;       bv = b.ticker;       break;
      case "totalShares":  av = a.totalShares;  bv = b.totalShares;  break;
      case "totalValue":   av = a.totalValue;   bv = b.totalValue;   break;
      case "alloc":       av = a.totalValue / totalValue; bv = b.totalValue / totalValue; break;
      case "costBasis":   av = a.costBasis ?? -Infinity;  bv = b.costBasis ?? -Infinity;  break;
      case "gainPercent": av = a.gainPercent ?? -Infinity; bv = b.gainPercent ?? -Infinity; break;
      case "return1D":    av = a.return1D ?? -Infinity;   bv = b.return1D ?? -Infinity;   break;
      case "return1M":    av = a.return1M ?? -Infinity;   bv = b.return1M ?? -Infinity;   break;
      case "return6M":    av = a.return6M ?? -Infinity;   bv = b.return6M ?? -Infinity;   break;
    }
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 inline-block transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`}>
      {active && dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

interface Props {
  aggregated: AggregatedHolding[];
  totalValue: number;
}

export default function HoldingsTable({ aggregated, totalValue }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("totalValue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const rows = sortRows(aggregated, sortKey, sortDir, totalValue);

  function Th({
    col,
    label,
    align = "right",
    className = "",
  }: {
    col: SortKey;
    label: string;
    align?: "left" | "right";
    className?: string;
  }) {
    const active = sortKey === col;
    return (
      <th
        className={`group py-3 px-2 text-${align} cursor-pointer select-none whitespace-nowrap
          ${active ? "text-blue-400" : "text-gray-400 hover:text-gray-200"}
          transition-colors ${className}`}
        onClick={() => handleSort(col)}
      >
        {label}
        <SortIcon active={active} dir={sortDir} />
      </th>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700">
        <h2 className="font-semibold text-gray-100">Holdings</h2>
      </div>
      <div className="px-3 py-2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider border-b border-gray-700">
              <Th col="ticker"      label="Ticker"   align="left" />
              <th className="text-left py-3 px-2 text-gray-400 hidden md:table-cell">Name</th>
              <Th col="totalShares" label="Shares"  className="hidden sm:table-cell" />
              <Th col="totalValue"  label="Value"   />
              <Th col="alloc"       label="Alloc"   className="hidden sm:table-cell" />
              <Th col="costBasis"   label="Cost"    className="hidden md:table-cell" />
              <Th col="gainPercent" label="Gain"    />
              <Th col="return1D"    label="1D"      />
              <Th col="return1M"    label="1M"      className="hidden sm:table-cell" />
              <Th col="return6M"    label="6M"      className="hidden sm:table-cell" />
              <th className="text-left py-3 px-2 text-gray-400 hidden lg:table-cell">Brokers</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.ticker}
                className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <td className="py-3 px-2 font-semibold text-blue-300">{r.ticker}</td>
                <td className="py-3 px-2 text-gray-300 hidden md:table-cell max-w-[180px] truncate">
                  {r.holdingName}
                </td>
                <td className="py-3 px-2 text-right font-mono text-gray-300 hidden sm:table-cell">
                  {r.totalShares % 1 === 0
                    ? r.totalShares.toLocaleString()
                    : r.totalShares.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </td>
                <td className="py-3 px-2 text-right font-mono">{fmt(r.totalValue)}</td>
                <td className="py-3 px-2 text-right text-gray-400 hidden sm:table-cell">
                  {((r.totalValue / totalValue) * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-2 text-right text-gray-400 font-mono hidden md:table-cell">
                  {r.costBasis !== null ? fmt(r.costBasis) : "—"}
                </td>
                <td className="py-3 px-2 text-right"><PctCell value={r.gainPercent} /></td>
                <td className="py-3 px-2 text-right"><PctCell value={r.return1D} /></td>
                <td className="py-3 px-2 text-right hidden sm:table-cell"><PctCell value={r.return1M} /></td>
                <td className="py-3 px-2 text-right hidden sm:table-cell"><PctCell value={r.return6M} /></td>
                <td className="py-3 px-2 text-gray-400 text-xs hidden lg:table-cell">
                  {r.brokers.join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
