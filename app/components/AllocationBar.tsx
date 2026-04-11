import { AggregatedHolding } from "../types/portfolio";

const COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-lime-500",
  "bg-orange-500",
  "bg-teal-500",
];

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AllocationBar({
  aggregated,
  totalValue,
}: {
  aggregated: AggregatedHolding[];
  totalValue: number;
}) {
  // Show top 8, group rest as "Other"
  const top = aggregated.slice(0, 8);
  const otherValue = aggregated
    .slice(8)
    .reduce((sum, h) => sum + h.totalValue, 0);

  const items = [
    ...top,
    ...(otherValue > 0
      ? [
          {
            ticker: "Other",
            holdingName: "Other",
            totalValue: otherValue,
          } as AggregatedHolding,
        ]
      : []),
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-100">Allocation</h2>

      {/* Stacked bar */}
      <div className="flex h-6 rounded-full overflow-hidden gap-px">
        {items.map((item, i) => (
          <div
            key={item.ticker}
            className={`${COLORS[i % COLORS.length]} transition-all`}
            style={{ width: `${(item.totalValue / totalValue) * 100}%` }}
            title={`${item.ticker}: ${((item.totalValue / totalValue) * 100).toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {items.map((item, i) => (
          <div key={item.ticker} className="flex items-center gap-2 text-sm">
            <span
              className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${COLORS[i % COLORS.length]}`}
            />
            <span className="text-gray-300 font-medium">{item.ticker}</span>
            <span className="text-gray-500">
              {((item.totalValue / totalValue) * 100).toFixed(1)}%
            </span>
            <span className="text-gray-500 hidden sm:inline">
              {fmt(item.totalValue)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
