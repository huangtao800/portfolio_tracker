import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { eq, and, desc } from "drizzle-orm";
import YahooFinance from "yahoo-finance2";
import { authOptions } from "../../lib/auth";
import { db } from "../../lib/db";
import { snapshots, holdings } from "../../lib/schema";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the most recent snapshot
  const [latestSnapshot] = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.userId, userId))
    .orderBy(desc(snapshots.snapshotDate))
    .limit(1);

  if (!latestSnapshot) {
    return NextResponse.json({ error: "No existing snapshot to sync from" }, { status: 400 });
  }

  const existingHoldings = await db
    .select()
    .from(holdings)
    .where(eq(holdings.snapshotId, latestSnapshot.snapshotId));

  if (existingHoldings.length === 0) {
    return NextResponse.json({ error: "No holdings in latest snapshot" }, { status: 400 });
  }

  const tickers = [...new Set(existingHoldings.map((h) => h.ticker))];

  // Fetch current prices from Yahoo Finance in parallel (skip USD — always $1.00)
  const priceMap = new Map<string, { price: number; return1d: number | null }>();
  const fallbackTickers: string[] = [];

  for (const ticker of tickers) {
    if (ticker === "USD") {
      priceMap.set("USD", { price: 1.0, return1d: 0 });
    }
  }

  await Promise.allSettled(
    tickers.filter((t) => t !== "USD").map(async (ticker) => {
      try {
        const quote = await yahooFinance.quote(ticker);
        if (quote.regularMarketPrice != null) {
          priceMap.set(ticker, {
            price: quote.regularMarketPrice,
            return1d: quote.regularMarketChangePercent ?? null,
          });
        } else {
          throw new Error("No regularMarketPrice in response");
        }
      } catch (err) {
        console.error(`[sync] price fetch failed for ${ticker}:`, err);
        fallbackTickers.push(ticker);
      }
    })
  );

  // Today's date in Pacific time
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());

  // If today's snapshot already exists, delete its holdings and reuse the ID
  const [existing] = await db
    .select({ snapshotId: snapshots.snapshotId })
    .from(snapshots)
    .where(and(eq(snapshots.userId, userId), eq(snapshots.snapshotDate, today)))
    .limit(1);

  let snapshotId: string;
  if (existing) {
    snapshotId = existing.snapshotId;
    await db.delete(holdings).where(eq(holdings.snapshotId, snapshotId));
  } else {
    snapshotId = randomUUID();
    await db.insert(snapshots).values({ snapshotId, userId, snapshotDate: today });
  }

  // Build new holdings with updated prices
  const newHoldings = existingHoldings.map((h) => {
    const fetched = priceMap.get(h.ticker);
    const sharePrice = fetched?.price ?? (h.sharePrice != null ? Number(h.sharePrice) : null);
    const shares = Number(h.shares);
    const totalValue = sharePrice != null ? shares * sharePrice : Number(h.totalValue);
    const costBasis = h.costBasis != null ? Number(h.costBasis) : null;
    const totalValueGainPct =
      costBasis != null && costBasis > 0
        ? ((totalValue - costBasis) / costBasis) * 100
        : h.totalValueGainPct != null ? Number(h.totalValueGainPct) : null;
    const return1d = fetched?.return1d ?? (h.return1d != null ? Number(h.return1d) : null);

    return {
      holdingId: randomUUID(),
      snapshotId,
      ticker: h.ticker,
      securityId: h.securityId ?? null,
      broker: h.broker,
      shares: h.shares,
      sharePrice: sharePrice != null ? String(sharePrice) : null,
      totalValue: String(totalValue),
      costBasis: h.costBasis,
      totalValueGainPct: totalValueGainPct != null ? String(totalValueGainPct) : null,
      return1d: return1d != null ? String(return1d) : null,
      return1m: h.return1m,
      return6m: h.return6m,
    };
  });

  await db.insert(holdings).values(newHoldings);

  return NextResponse.json({
    ok: true,
    date: today,
    rows: newHoldings.length,
    fallback: fallbackTickers,
  });
}
