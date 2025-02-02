import {
  PortfolioEntry,
  TimeSeriesData,
  AssetAllocation,
  TimeRange,
} from "../types/portfolio";
import {
  getAssetSubCategory,
  categoryColors,
  subCategoryOrder,
} from "./assetCategories";
import { getAssetCategory } from "./assetClassification";

export function calculateTimeSeriesData(
  data: PortfolioEntry[],
  timeRange: TimeRange
): TimeSeriesData[] {
  // Group by date and sum current values
  const dailyTotals = new Map<string, number>();

  data.forEach((entry) => {
    const currentTotal = dailyTotals.get(entry.date) || 0;
    dailyTotals.set(entry.date, currentTotal + entry.currentValue);
  });

  // Convert to array and sort by date
  const timeSeriesData = Array.from(dailyTotals.entries())
    .map(([date, netWorth]) => ({ date, netWorth }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Filter based on time range
  const now = new Date();
  const filterDate = getFilterDate(now, timeRange);

  return timeSeriesData.filter((entry) => new Date(entry.date) >= filterDate);
}

function getFilterDate(now: Date, timeRange: TimeRange): Date {
  const date = new Date(now);

  switch (timeRange) {
    case "30d":
      date.setDate(date.getDate() - 30);
      break;
    case "6m":
      date.setMonth(date.getMonth() - 6);
      break;
    case "1y":
      date.setFullYear(date.getFullYear() - 1);
      break;
    case "3y":
      date.setFullYear(date.getFullYear() - 3);
      break;
    case "5y":
      date.setFullYear(date.getFullYear() - 5);
      break;
    case "ytd":
      date.setMonth(0, 1);
      break;
    case "all":
      return new Date(0);
  }

  return date;
}

export async function calculateAssetAllocation(
  data: PortfolioEntry[]
): Promise<AssetAllocation[]> {
  // Group holdings by category
  const categoryGroups = new Map<string, PortfolioEntry[]>();

  const processEntries = async () => {
    for (const entry of data) {
      const category = await getAssetCategory(entry.symbol);
      const currentGroup = categoryGroups.get(category) || [];
      categoryGroups.set(category, [...currentGroup, entry]);
    }
  };
  await processEntries();

  // Calculate totals and percentages
  const totalValue = data.reduce((sum, entry) => sum + entry.currentValue, 0);
  const allocation = Array.from(categoryGroups.entries()).map(
    ([category, holdings]) => {
      const value = holdings.reduce(
        (sum, entry) => sum + entry.currentValue,
        0
      );
      return {
        assetClass: category,
        value,
        percentage: (value / totalValue) * 100,
        holdings: holdings.sort((a, b) => b.currentValue - a.currentValue),
      };
    }
  );
  // Sort by percentage descending
  return allocation.sort((a, b) => b.percentage - a.percentage);
}
