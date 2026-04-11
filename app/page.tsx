import { loadPortfolioData, loadTimeSeries } from "./utils/csvParser";
import SummaryCards from "./components/SummaryCards";
import HoldingsTable from "./components/HoldingsTable";
import AllocationBar from "./components/AllocationBar";
import AssetTypeChart from "./components/AssetTypeChart";
import NetWorthChart from "./components/NetWorthChart";

export const dynamic = "force-dynamic";

export default function Home() {
  const data = loadPortfolioData();
  const { aggregated, summary } = data;
  const timeSeries = loadTimeSeries();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        {summary.date && (
          <span className="text-sm text-gray-500">as of {summary.date}</span>
        )}
      </div>

      <SummaryCards summary={summary} />

      <NetWorthChart data={timeSeries} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AssetTypeChart aggregated={aggregated} totalValue={summary.totalValue} />
        <AllocationBar aggregated={aggregated} totalValue={summary.totalValue} />
      </div>

      <HoldingsTable
        aggregated={aggregated}
        totalValue={summary.totalValue}
      />
    </main>
  );
}
