import { NextResponse } from "next/server";
import { getHistoricalData, readLatestCSV } from "utils/csvParser";
import { TimeRange } from "types/portfolio";
import {
  calculateTimeSeriesData,
  calculateAssetAllocation,
} from "utils/calculations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get("timeRange") as TimeRange) || "ytd";

    const historicalData = await getHistoricalData();
    const latestData = await readLatestCSV();

    const timeSeriesData = calculateTimeSeriesData(historicalData, timeRange);
    const assetAllocation = await calculateAssetAllocation(latestData);

    return NextResponse.json({
      timeSeriesData,
      assetAllocation,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio data" },
      { status: 500 }
    );
  }
}
