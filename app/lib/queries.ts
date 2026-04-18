import "server-only";
import { desc, eq, asc, isNotNull, and } from "drizzle-orm";

// snapshotDate is mode:"string" — Drizzle returns it as-is from MySQL
function toDateStr(d: string): string {
  return d.substring(0, 10);
}
import { db } from "./db";
import { holdings, snapshots, securities } from "./schema";
import {
  Holding,
  AggregatedHolding,
  PortfolioData,
  TimeSeriesPoint,
} from "../types/portfolio";

// ── Aggregation (pure logic, no I/O) ────────────────────────────────────────

function aggregateHoldings(rows: Holding[]): AggregatedHolding[] {
  const map = new Map<string, AggregatedHolding>();

  for (const h of rows) {
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

// ── Queries ──────────────────────────────────────────────────────────────────

const EMPTY_PORTFOLIO: PortfolioData = {
  holdings: [],
  aggregated: [],
  summary: { totalValue: 0, totalCostBasis: 0, totalGain: 0, totalGainPercent: 0, date: "" },
};

export async function loadPortfolioData(userId: string): Promise<PortfolioData> {
  // Most recent snapshot for this user
  const [snapshot] = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.userId, userId))
    .orderBy(desc(snapshots.snapshotDate))
    .limit(1);

  if (!snapshot) return EMPTY_PORTFOLIO;

  // Holdings joined with security master data
  const rows = await db
    .select({
      ticker:               holdings.ticker,
      holdingName:          securities.name,
      exchange:             securities.exchange,
      broker:               holdings.broker,
      shares:               holdings.shares,
      sharePrice:           holdings.sharePrice,
      totalValue:           holdings.totalValue,
      totalValueGainPercent: holdings.totalValueGainPct,
      costBasis:            holdings.costBasis,
      return1D:             holdings.return1d,
      return1M:             holdings.return1m,
      return6M:             holdings.return6m,
    })
    .from(holdings)
    .innerJoin(securities, eq(holdings.ticker, securities.ticker))
    .where(and(eq(holdings.snapshotId, snapshot.snapshotId), isNotNull(holdings.ticker)))
    .orderBy(desc(holdings.totalValue));

  const holdingsList: Holding[] = rows.map((r) => ({
    ticker:               r.ticker ?? "",
    holdingName:          r.holdingName,
    exchange:             r.exchange ?? "",
    broker:               r.broker,
    shares:               Number(r.shares),
    sharePrice:           r.sharePrice !== null ? Number(r.sharePrice) : null,
    totalValue:           Number(r.totalValue),
    totalValueGainPercent: r.totalValueGainPercent !== null ? Number(r.totalValueGainPercent) : null,
    costBasis:            r.costBasis !== null ? Number(r.costBasis) : null,
    return1D:             r.return1D !== null ? Number(r.return1D) : null,
    return1M:             r.return1M !== null ? Number(r.return1M) : null,
    return6M:             r.return6M !== null ? Number(r.return6M) : null,
    date:                 toDateStr(snapshot.snapshotDate),
  }));

  const aggregated = aggregateHoldings(holdingsList);
  const totalValue = holdingsList.reduce((s, h) => s + h.totalValue, 0);
  const totalCostBasis = holdingsList.reduce((s, h) => s + (h.costBasis ?? 0), 0);
  const totalGain = totalValue - totalCostBasis;
  const totalGainPercent = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  return {
    holdings: holdingsList,
    aggregated,
    summary: {
      totalValue,
      totalCostBasis,
      totalGain,
      totalGainPercent,
      date: toDateStr(snapshot.snapshotDate),
    },
  };
}

export async function loadTimeSeries(userId: string): Promise<TimeSeriesPoint[]> {
  const snapshotList = await db
    .select({ snapshotId: snapshots.snapshotId, snapshotDate: snapshots.snapshotDate })
    .from(snapshots)
    .where(eq(snapshots.userId, userId))
    .orderBy(asc(snapshots.snapshotDate));

  const points: TimeSeriesPoint[] = [];

  for (const snapshot of snapshotList) {
    const rows = await db
      .select({ totalValue: holdings.totalValue, costBasis: holdings.costBasis })
      .from(holdings)
      .where(eq(holdings.snapshotId, snapshot.snapshotId));

    const totalValue = rows.reduce((s, r) => s + Number(r.totalValue), 0);
    const totalCostBasis = rows.reduce((s, r) => s + (r.costBasis !== null ? Number(r.costBasis) : 0), 0);

    points.push({ date: toDateStr(snapshot.snapshotDate), totalValue, totalCostBasis });
  }

  return points;
}
