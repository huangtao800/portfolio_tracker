import "server-only";
import YahooFinance from "yahoo-finance2";
import { TimeSeriesPoint } from "../types/portfolio";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey", "ripHistorical"] });

function toDateStr(d: Date): string {
  return d.toISOString().substring(0, 10);
}

// Find the nearest trading day price on or before a given date
function nearestPrice(priceMap: Record<string, number>, dateStr: string): number | null {
  for (let i = 0; i <= 7; i++) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() - i);
    const price = priceMap[toDateStr(d)];
    if (price !== undefined) return price;
  }
  return null;
}

export async function fetchSP500Benchmark(
  timeSeries: TimeSeriesPoint[]
): Promise<Record<string, number>> {
  if (timeSeries.length < 2) return {};

  // Fetch a few days before the first snapshot to handle weekends/holidays
  const startDate = new Date(timeSeries[0].date + "T00:00:00");
  startDate.setDate(startDate.getDate() - 7);
  // Extend end date a few days forward so Yahoo Finance includes the most recent trading days
  const endDateObj = new Date(timeSeries[timeSeries.length - 1].date + "T00:00:00");
  endDateObj.setDate(endDateObj.getDate() + 5);
  const endDate = toDateStr(endDateObj);

  try {
    const chartResult = await yahooFinance.chart(
      "VOO",
      { period1: toDateStr(startDate), period2: endDate, interval: "1d" }
    );

    const quotes = chartResult?.quotes;
    if (!quotes || quotes.length === 0) return {};

    // Build date -> close price map
    const priceMap: Record<string, number> = {};
    for (const row of quotes) {
      if (row.close != null) priceMap[toDateStr(row.date)] = row.close;
    }

    // Reference price: nearest trading day on or after first snapshot
    const refPrice = nearestPrice(priceMap, timeSeries[0].date);
    if (!refPrice) return {};

    // Store price ratio relative to first snapshot (renormalization happens in the chart)
    const result: Record<string, number> = {};
    for (const point of timeSeries) {
      const price = nearestPrice(priceMap, point.date);
      if (price !== null) {
        result[point.date] = price / refPrice;
      }
    }
    return result;
  } catch {
    return {};
  }
}
