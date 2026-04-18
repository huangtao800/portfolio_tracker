import "server-only";
import { desc, eq, asc, isNotNull, and, inArray } from "drizzle-orm";

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
  // Get all snapshots for the user, ordered desc so first per account = latest
  const allSnapshots = await db
    .select()
    .from(snapshots)
    .where(and(eq(snapshots.userId, userId), isNotNull(snapshots.accountId)))
    .orderBy(desc(snapshots.snapshotDate));

  if (allSnapshots.length === 0) return EMPTY_PORTFOLIO;

  // Latest snapshot per account (accountId key; null accounts each get their own key)
  const latestPerAccount = new Map<string, typeof allSnapshots[0]>();
  for (const s of allSnapshots) {
    const key = s.accountId!;
    if (!latestPerAccount.has(key)) latestPerAccount.set(key, s);
  }

  const latestSnapshots = Array.from(latestPerAccount.values());
  const snapshotIds = latestSnapshots.map((s) => s.snapshotId);
  const latestDate = latestSnapshots.reduce((max, s) =>
    s.snapshotDate > max ? s.snapshotDate : max, latestSnapshots[0].snapshotDate);

  // Holdings joined with security master data across all latest snapshots
  const rows = await db
    .select({
      ticker:                holdings.ticker,
      holdingName:           securities.name,
      exchange:              securities.exchange,
      broker:                holdings.broker,
      shares:                holdings.shares,
      sharePrice:            holdings.sharePrice,
      totalValue:            holdings.totalValue,
      totalValueGainPercent: holdings.totalValueGainPct,
      costBasis:             holdings.costBasis,
      return1D:              holdings.return1d,
      return1M:              holdings.return1m,
      return6M:              holdings.return6m,
    })
    .from(holdings)
    .innerJoin(securities, eq(holdings.ticker, securities.ticker))
    .where(and(inArray(holdings.snapshotId, snapshotIds), isNotNull(holdings.ticker)))
    .orderBy(desc(holdings.totalValue));

  const holdingsList: Holding[] = rows.map((r) => ({
    ticker:                r.ticker ?? "",
    holdingName:           r.holdingName,
    exchange:              r.exchange ?? "",
    broker:                r.broker,
    shares:                Number(r.shares),
    sharePrice:            r.sharePrice !== null ? Number(r.sharePrice) : null,
    totalValue:            Number(r.totalValue),
    totalValueGainPercent: r.totalValueGainPercent !== null ? Number(r.totalValueGainPercent) : null,
    costBasis:             r.costBasis !== null ? Number(r.costBasis) : null,
    return1D:              r.return1D !== null ? Number(r.return1D) : null,
    return1M:              r.return1M !== null ? Number(r.return1M) : null,
    return6M:              r.return6M !== null ? Number(r.return6M) : null,
    date:                  toDateStr(latestDate),
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
      date: toDateStr(latestDate),
    },
  };
}

export async function loadTimeSeries(userId: string): Promise<TimeSeriesPoint[]> {
  const snapshotList = await db
    .select({ snapshotId: snapshots.snapshotId, snapshotDate: snapshots.snapshotDate, accountId: snapshots.accountId })
    .from(snapshots)
    .where(and(eq(snapshots.userId, userId), isNotNull(snapshots.accountId)))
    .orderBy(asc(snapshots.snapshotDate));

  if (snapshotList.length === 0) return [];

  // Group snapshots by accountId, sorted asc by date
  const byAccount = new Map<string, Array<{ date: string; snapshotId: string }>>();
  const allDatesSet = new Set<string>();
  for (const s of snapshotList) {
    const date = toDateStr(s.snapshotDate);
    allDatesSet.add(date);
    const accountId = s.accountId!;
    if (!byAccount.has(accountId)) byAccount.set(accountId, []);
    byAccount.get(accountId)!.push({ date, snapshotId: s.snapshotId });
  }

  const allDates = Array.from(allDatesSet).sort();

  // Load all holdings for all snapshots in one query
  const allSnapshotIds = snapshotList.map((s) => s.snapshotId);
  const allHoldings = await db
    .select({ snapshotId: holdings.snapshotId, totalValue: holdings.totalValue, costBasis: holdings.costBasis })
    .from(holdings)
    .where(inArray(holdings.snapshotId, allSnapshotIds));

  const holdingsBySnapshot = new Map<string, typeof allHoldings>();
  for (const h of allHoldings) {
    if (!holdingsBySnapshot.has(h.snapshotId)) holdingsBySnapshot.set(h.snapshotId, []);
    holdingsBySnapshot.get(h.snapshotId)!.push(h);
  }

  // For each date, carry forward each account's last known snapshot
  const points: TimeSeriesPoint[] = [];
  for (const date of allDates) {
    let totalValue = 0, totalCostBasis = 0;
    for (const accountSnapshots of byAccount.values()) {
      // Find latest snapshot on or before this date (list is sorted asc)
      let latestSnapshotId: string | null = null;
      for (const s of accountSnapshots) {
        if (s.date <= date) latestSnapshotId = s.snapshotId;
        else break;
      }
      if (latestSnapshotId) {
        for (const h of holdingsBySnapshot.get(latestSnapshotId) ?? []) {
          totalValue += Number(h.totalValue);
          totalCostBasis += h.costBasis !== null ? Number(h.costBasis) : 0;
        }
      }
    }
    points.push({ date, totalValue, totalCostBasis });
  }

  return points;
}
