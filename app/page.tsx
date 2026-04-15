import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./lib/auth";
import { loadPortfolioData, loadTimeSeries } from "./lib/queries";
import { buildCategoryMap } from "./utils/assetCategories";
import UploadButton from "./components/UploadButton";
import SummaryCards from "./components/SummaryCards";
import HoldingsTable from "./components/HoldingsTable";
import AllocationBar from "./components/AllocationBar";
import AssetTypeChart from "./components/AssetTypeChart";
import NetWorthChart from "./components/NetWorthChart";
import { HideValuesProvider } from "./context/HideValues";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) redirect("/login");

  const userId = session.user.userId;

  const [data, timeSeries] = await Promise.all([
    loadPortfolioData(userId),
    loadTimeSeries(userId),
  ]);

  const { aggregated, summary } = data;
  const categoryMap = await buildCategoryMap(aggregated.map((h) => h.ticker));

  const cashAndBonds = aggregated
    .filter((h) => ["Cash & Short-term", "Bonds"].includes(categoryMap[h.ticker] ?? ""))
    .reduce((sum, h) => sum + h.totalValue, 0);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Serving Ass🍑 and Assets📈</h1>
        <div className="flex items-center gap-3">
          {summary.date && (
            <span className="text-sm text-gray-500">as of {summary.date}</span>
          )}
          <UploadButton />
        </div>
      </div>

      <HideValuesProvider>
        <SummaryCards summary={summary} cashAndBonds={cashAndBonds} />
        <NetWorthChart data={timeSeries} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AssetTypeChart aggregated={aggregated} totalValue={summary.totalValue} categoryMap={categoryMap} />
          <AllocationBar aggregated={aggregated} totalValue={summary.totalValue} />
        </div>

        <HoldingsTable aggregated={aggregated} totalValue={summary.totalValue} />
      </HideValuesProvider>
    </main>
  );
}
