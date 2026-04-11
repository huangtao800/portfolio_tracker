import { PortfolioSummary } from "../types/portfolio";

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

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
}

function Card({ label, value, sub, positive }: CardProps) {
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
      <span className={`text-2xl font-semibold ${valueColor}`}>{value}</span>
      {sub && <span className="text-sm text-gray-400">{sub}</span>}
    </div>
  );
}

export default function SummaryCards({ summary }: { summary: PortfolioSummary }) {
  const { totalValue, totalCostBasis, totalGain, totalGainPercent } = summary;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card label="Total Value" value={fmt(totalValue)} />
      <Card label="Cost Basis" value={fmt(totalCostBasis)} />
      <Card
        label="Total Gain"
        value={fmt(totalGain)}
        sub={fmtPct(totalGainPercent)}
        positive={totalGain >= 0}
      />
      <Card
        label="Total Return"
        value={fmtPct(totalGainPercent)}
        positive={totalGainPercent >= 0}
      />
    </div>
  );
}
