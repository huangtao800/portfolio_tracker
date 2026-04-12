import "server-only";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { securities, snapshots, holdings } from "./schema";
import { parseCsv } from "../utils/csvParser";

const DATA_DIR = path.join(process.cwd(), "portfolio_data");

export async function syncCsvToDb(): Promise<void> {
  const userId = process.env.PORTFOLIO_OWNER_ID;
  if (!userId) {
    console.warn("[sync] PORTFOLIO_OWNER_ID is not set — skipping sync.");
    return;
  }

  // All CSV files in portfolio_data/
  let files: string[];
  try {
    files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".csv")).sort();
  } catch {
    console.warn(`[sync] portfolio_data/ directory not found — skipping sync.`);
    return;
  }

  if (files.length === 0) {
    console.log("[sync] No CSV files found.");
    return;
  }

  // Dates already in the DB for this user
  const existing = await db
    .select({ snapshotDate: snapshots.snapshotDate })
    .from(snapshots)
    .where(eq(snapshots.userId, userId));

  const toDateStr = (d: unknown): string => {
    if (typeof d === "string") return d.substring(0, 10);
    if (d instanceof Date) return d.toISOString().substring(0, 10);
    return String(d).substring(0, 10);
  };

  const existingDates = new Set(existing.map((r) => toDateStr(r.snapshotDate)));

  const newFiles = files.filter((file) => {
    const date = file.replace("portfolio_", "").replace(".csv", "");
    return !existingDates.has(date);
  });

  if (newFiles.length === 0) {
    console.log("[sync] All CSV files already imported — nothing to do.");
    return;
  }

  console.log(`[sync] Importing ${newFiles.length} new file(s): ${newFiles.join(", ")}`);

  for (const file of newFiles) {
    const filePath = path.join(DATA_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const rows = parseCsv(content);

    if (rows.length === 0) {
      console.warn(`[sync] ${file}: no rows parsed, skipping.`);
      continue;
    }

    const snapshotDate = rows[0].date || file.replace("portfolio_", "").replace(".csv", "");

    for (const row of rows) {
      await db
        .insert(securities)
        .values({ ticker: row.ticker, name: row.name, exchange: row.exchange || null })
        .onDuplicateKeyUpdate({ set: { name: row.name, exchange: row.exchange || null } });
    }

    const snapshotId = randomUUID();
    await db.insert(snapshots)
      .values({ snapshotId, userId, snapshotDate })
      .onDuplicateKeyUpdate({ set: { snapshotDate } });

    await db.insert(holdings).values(
      rows.map((row) => ({
        holdingId:          randomUUID(),
        snapshotId,
        ticker:             row.ticker,
        broker:             row.broker,
        shares:             row.shares,
        sharePrice:         row.sharePrice,
        totalValue:         row.totalValue,
        costBasis:          row.costBasis,
        totalValueGainPct:  row.totalValueGainPct,
        return1d:           row.return1d,
        return1m:           row.return1m,
        return6m:           row.return6m,
      }))
    );

    console.log(`[sync] ${file}: imported ${rows.length} holdings for ${snapshotDate}.`);
  }

  console.log("[sync] Done.");
}
