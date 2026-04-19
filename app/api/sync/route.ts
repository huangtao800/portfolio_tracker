import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { eq, and, desc, isNotNull } from "drizzle-orm";
import YahooFinance from "yahoo-finance2";
import { authOptions } from "../../lib/auth";
import { plaidClient } from "../../lib/plaid";
import { db } from "../../lib/db";
import { snapshots, holdings, accounts, plaidItems, securities } from "../../lib/schema";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());

  // ── Step 1: Sync Plaid accounts ────────────────────────────────────────────
  const plaidItemsList = await db
    .select()
    .from(plaidItems)
    .where(eq(plaidItems.userId, userId));

  let plaidRows = 0;

  for (const item of plaidItemsList) {
    let holdingsResponse;
    try {
      holdingsResponse = await plaidClient.investmentsHoldingsGet({
        access_token: item.accessToken,
      });
    } catch (err) {
      console.error(`[sync] Plaid holdings fetch failed for item ${item.plaidItemId}:`, err);
      continue;
    }

    const {
      holdings: plaidHoldings,
      securities: plaidSecurities,
      accounts: plaidAccounts,
    } = holdingsResponse.data;

    // Upsert securities; build plaidSecurityId → internal securityId map
    const securityIdMap = new Map<string, string>();
    for (const sec of plaidSecurities) {
      await db
        .insert(securities)
        .values({
          securityId:       randomUUID(),
          ticker:           sec.ticker_symbol ?? null,
          name:             sec.name ?? "Unknown",
          plaidSecurityId:  sec.security_id,
          type:             sec.type ?? null,
          isCashEquivalent: sec.is_cash_equivalent ?? false,
        })
        .onDuplicateKeyUpdate({
          set: {
            plaidSecurityId:  sec.security_id,
            name:             sec.name ?? "Unknown",
            type:             sec.type ?? null,
            isCashEquivalent: sec.is_cash_equivalent ?? false,
          },
        });

      const [saved] = await db
        .select({ securityId: securities.securityId })
        .from(securities)
        .where(eq(securities.plaidSecurityId, sec.security_id))
        .limit(1);

      if (saved) securityIdMap.set(sec.security_id, saved.securityId);
    }

    // Build plaidAccountId → internal accountId map
    const accountIdMap = new Map<string, string>();
    for (const acct of plaidAccounts) {
      const [existing] = await db
        .select({ accountId: accounts.accountId })
        .from(accounts)
        .where(eq(accounts.plaidAccountId, acct.account_id))
        .limit(1);
      if (existing) accountIdMap.set(acct.account_id, existing.accountId);
    }

    // Group Plaid holdings by account
    const holdingsByAccount = new Map<string, typeof plaidHoldings>();
    for (const h of plaidHoldings) {
      if (!holdingsByAccount.has(h.account_id)) holdingsByAccount.set(h.account_id, []);
      holdingsByAccount.get(h.account_id)!.push(h);
    }

    // Upsert snapshot + holdings per Plaid account
    for (const [plaidAccountId, accountHoldings] of holdingsByAccount) {
      const accountId = accountIdMap.get(plaidAccountId);
      if (!accountId) continue;

      const [existingSnapshot] = await db
        .select({ snapshotId: snapshots.snapshotId })
        .from(snapshots)
        .where(and(eq(snapshots.accountId, accountId), eq(snapshots.snapshotDate, today)))
        .limit(1);

      let snapshotId: string;
      if (existingSnapshot) {
        snapshotId = existingSnapshot.snapshotId;
        await db.delete(holdings).where(eq(holdings.snapshotId, snapshotId));
      } else {
        snapshotId = randomUUID();
        await db.insert(snapshots).values({ snapshotId, userId, accountId, snapshotDate: today });
      }

      const holdingRows = accountHoldings
        .filter((h) => securityIdMap.has(h.security_id))
        .map((h) => {
          const securityId = securityIdMap.get(h.security_id)!;
          const sec = plaidSecurities.find((s) => s.security_id === h.security_id);
          const costBasis = h.cost_basis ?? null;
          const totalValueGainPct =
            costBasis != null && costBasis > 0
              ? ((h.institution_value - costBasis) / costBasis) * 100
              : null;

          return {
            holdingId:         randomUUID(),
            snapshotId,
            ticker:            sec?.ticker_symbol ?? null,
            securityId,
            broker:            item.institutionName ?? "Plaid",
            shares:            String(h.quantity),
            sharePrice:        String(h.institution_price),
            totalValue:        String(h.institution_value),
            costBasis:         costBasis != null ? String(costBasis) : null,
            totalValueGainPct: totalValueGainPct != null ? String(totalValueGainPct) : null,
          };
        });

      if (holdingRows.length > 0) {
        await db.insert(holdings).values(holdingRows);
        plaidRows += holdingRows.length;
      }
    }
  }

  // ── Step 2: Sync manual accounts with Yahoo Finance prices ─────────────────
  const manualAccounts = await db
    .select({ accountId: accounts.accountId })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.source, "manual")));

  const fallbackTickers: string[] = [];
  let manualRows = 0;

  for (const { accountId } of manualAccounts) {
    // Skip if today's snapshot already exists (e.g. manual CSV upload today)
    const [todaySnapshot] = await db
      .select({ snapshotId: snapshots.snapshotId })
      .from(snapshots)
      .where(and(eq(snapshots.accountId, accountId), eq(snapshots.snapshotDate, today)))
      .limit(1);

    if (todaySnapshot) continue;

    // Get the latest snapshot for this account
    const [latestSnapshot] = await db
      .select({ snapshotId: snapshots.snapshotId })
      .from(snapshots)
      .where(and(eq(snapshots.accountId, accountId), isNotNull(snapshots.accountId)))
      .orderBy(desc(snapshots.snapshotDate))
      .limit(1);

    if (!latestSnapshot) continue;

    const existingHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.snapshotId, latestSnapshot.snapshotId));

    if (existingHoldings.length === 0) continue;

    // Fetch Yahoo Finance prices for this account's tickers
    const tickers = [
      ...new Set(
        existingHoldings
          .map((h) => h.ticker)
          .filter((t): t is string => t !== null && t !== "USD")
      ),
    ];

    const priceMap = new Map<string, number>();
    priceMap.set("USD", 1.0);

    await Promise.allSettled(
      tickers.map(async (ticker) => {
        try {
          const quote = await yahooFinance.quote(ticker);
          if (quote.regularMarketPrice != null) {
            priceMap.set(ticker, quote.regularMarketPrice);
          }
        } catch (err) {
          console.error(`[sync] price fetch failed for ${ticker}:`, err);
          fallbackTickers.push(ticker);
        }
      })
    );

    // Create today's snapshot with updated prices
    const snapshotId = randomUUID();
    await db.insert(snapshots).values({ snapshotId, userId, accountId, snapshotDate: today });

    const newHoldings = existingHoldings.map((h) => {
      const fetchedPrice = h.ticker ? priceMap.get(h.ticker) : undefined;
      const sharePrice = fetchedPrice ?? (h.sharePrice != null ? Number(h.sharePrice) : null);
      const shares = Number(h.shares);
      const totalValue = sharePrice != null ? shares * sharePrice : Number(h.totalValue);
      const costBasis = h.costBasis != null ? Number(h.costBasis) : null;
      const totalValueGainPct =
        costBasis != null && costBasis > 0
          ? ((totalValue - costBasis) / costBasis) * 100
          : h.totalValueGainPct != null
          ? Number(h.totalValueGainPct)
          : null;

      return {
        holdingId:         randomUUID(),
        snapshotId,
        ticker:            h.ticker,
        securityId:        h.securityId,
        broker:            h.broker,
        shares:            h.shares,
        sharePrice:        sharePrice != null ? String(sharePrice) : null,
        totalValue:        String(totalValue),
        costBasis:         h.costBasis,
        totalValueGainPct: totalValueGainPct != null ? String(totalValueGainPct) : null,
      };
    });

    await db.insert(holdings).values(newHoldings);
    manualRows += newHoldings.length;
  }

  return NextResponse.json({
    ok: true,
    date: today,
    plaidRows,
    manualRows,
    fallback: fallbackTickers,
  });
}
