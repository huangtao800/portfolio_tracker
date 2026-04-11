import fs from "fs";
import path from "path";
import { Holding, AggregatedHolding, PortfolioData, TimeSeriesPoint } from "../types/portfolio";

function parseNum(val: string): number | null {
  if (!val || val.trim() === "N/A") return null;
  const n = parseFloat(val.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseHoldings(csvContent: string): Holding[] {
  const lines = csvContent.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const holdings: Holding[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 12) continue;

    const [
      ticker,
      holdingName,
      exchange,
      broker,
      sharesStr,
      sharePriceStr,
      totalValueStr,
      totalValueGainPctStr,
      costBasisStr,
      return1DStr,
      return1MStr,
      return6MStr,
      date,
    ] = cols;

    const totalValue = parseNum(totalValueStr);
    if (totalValue === null) continue;

    holdings.push({
      ticker: ticker.trim(),
      holdingName: holdingName.trim(),
      exchange: exchange.trim(),
      broker: broker.trim(),
      shares: parseNum(sharesStr) ?? 0,
      sharePrice: parseNum(sharePriceStr),
      totalValue,
      totalValueGainPercent: parseNum(totalValueGainPctStr),
      costBasis: parseNum(costBasisStr),
      return1D: parseNum(return1DStr),
      return1M: parseNum(return1MStr),
      return6M: parseNum(return6MStr),
      date: date?.trim() ?? "",
    });
  }
  return holdings;
}

function aggregateHoldings(holdings: Holding[]): AggregatedHolding[] {
  const map = new Map<string, AggregatedHolding>();

  for (const h of holdings) {
    if (!map.has(h.ticker)) {
      map.set(h.ticker, {
        ticker: h.ticker,
        holdingName: h.holdingName,
        totalShares: 0,
        totalValue: 0,
        costBasis: null,
        gain: null,
        gainPercent: null,
        return1D: h.return1D,
        return1M: h.return1M,
        return6M: h.return6M,
        brokers: [],
      });
    }
    const agg = map.get(h.ticker)!;
    agg.totalShares += h.shares;
    agg.totalValue += h.totalValue;
    if (h.costBasis !== null) {
      agg.costBasis = (agg.costBasis ?? 0) + h.costBasis;
    }
    if (!agg.brokers.includes(h.broker)) {
      agg.brokers.push(h.broker);
    }
  }

  for (const agg of map.values()) {
    if (agg.costBasis !== null) {
      agg.gain = agg.totalValue - agg.costBasis;
      agg.gainPercent = (agg.gain / agg.costBasis) * 100;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalValue - a.totalValue);
}

export function loadPortfolioData(): PortfolioData {
  const dataDir = path.join(process.cwd(), "portfolio_data");
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".csv"))
    .sort()
    .reverse(); // most recent first

  if (files.length === 0) {
    return {
      holdings: [],
      aggregated: [],
      summary: {
        totalValue: 0,
        totalCostBasis: 0,
        totalGain: 0,
        totalGainPercent: 0,
        date: "",
      },
    };
  }

  // Use the most recent file
  const latestFile = path.join(dataDir, files[0]);
  const content = fs.readFileSync(latestFile, "utf-8");
  const holdings = parseHoldings(content);
  const aggregated = aggregateHoldings(holdings);

  const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalCostBasis = holdings.reduce(
    (sum, h) => sum + (h.costBasis ?? 0),
    0
  );
  const totalGain = totalValue - totalCostBasis;
  const totalGainPercent =
    totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  const date =
    holdings.find((h) => h.date)?.date ?? files[0].replace(/\.csv$/, "");

  return {
    holdings,
    aggregated,
    summary: { totalValue, totalCostBasis, totalGain, totalGainPercent, date },
  };
}

export function loadTimeSeries(): TimeSeriesPoint[] {
  const dataDir = path.join(process.cwd(), "portfolio_data");
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".csv"))
    .sort(); // chronological order

  return files.map((file) => {
    const content = fs.readFileSync(path.join(dataDir, file), "utf-8");
    const holdings = parseHoldings(content);
    const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalCostBasis = holdings.reduce((sum, h) => sum + (h.costBasis ?? 0), 0);
    const date = holdings.find((h) => h.date)?.date ?? file.replace(/\.csv$/, "");
    return { date, totalValue, totalCostBasis };
  });
}
