import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and } from "drizzle-orm";
import { securities, snapshots, holdings } from "../app/lib/schema";

const USER_ID = "ed3c466d-65f3-4d05-a261-30bbe4bbd319";

// ── DB connection ────────────────────────────────────────────────────────────

const pool = mysql.createPool({
  host:     process.env.MYSQL_HOST     ?? "localhost",
  port:     Number(process.env.MYSQL_PORT ?? 3306),
  user:     process.env.MYSQL_USER     ?? "portfolio_user",
  password: process.env.MYSQL_PASSWORD ?? "portfolio_pass",
  database: process.env.MYSQL_DATABASE ?? "portfolio",
});

const db = drizzle(pool, { mode: "default" });

// ── CSV parsing ──────────────────────────────────────────────────────────────

function parseNum(val: string): string | null {
  if (!val || val.trim() === "N/A") return null;
  const n = parseFloat(val.replace(/,/g, ""));
  return isNaN(n) ? null : String(n);
}

function parseLine(line: string): string[] {
  const cols: string[] = [];
  let cur = "", inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { cols.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  cols.push(cur.trim());
  return cols;
}

interface Row {
  ticker: string; name: string; exchange: string; broker: string;
  shares: string; sharePrice: string | null; totalValue: string;
  totalValueGainPct: string | null; costBasis: string | null;
  return1d: string | null; return1m: string | null; return6m: string | null;
  date: string;
}

function parseCsv(content: string): Row[] {
  const lines = content.split("\n").filter((l) => l.trim());
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = parseLine(lines[i]);
    if (c.length < 12) continue;
    const totalValue = parseNum(c[6]);
    if (!totalValue) continue;
    rows.push({
      ticker: c[0].trim(), name: c[1].trim(), exchange: c[2].trim(),
      broker: c[3].trim(), shares: String(parseFloat(c[4]) || 0),
      sharePrice: parseNum(c[5]), totalValue,
      totalValueGainPct: parseNum(c[7]), costBasis: parseNum(c[8]),
      return1d: parseNum(c[9]), return1m: parseNum(c[10]),
      return6m: parseNum(c[11]), date: c[12]?.trim() ?? "",
    });
  }
  return rows;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dataDir = path.join(process.cwd(), "portfolio_data");
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".csv")).sort();

  console.log(`Found ${files.length} CSV file(s): ${files.join(", ")}\n`);

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const rows = parseCsv(fs.readFileSync(path.join(dataDir, file), "utf-8"));
    if (rows.length === 0) { console.log("  No rows, skipping.\n"); continue; }

    const snapshotDate = rows[0].date || file.replace("portfolio_", "").replace(".csv", "");

    // 1. Upsert securities
    for (const row of rows) {
      await db.insert(securities)
        .values({ ticker: row.ticker, name: row.name, exchange: row.exchange || null })
        .onDuplicateKeyUpdate({ set: { name: row.name, exchange: row.exchange || null } });
    }
    console.log(`  Upserted ${rows.length} securities.`);

    // 2. Get or create snapshot
    const existing = await db
      .select({ snapshotId: snapshots.snapshotId })
      .from(snapshots)
      .where(and(eq(snapshots.userId, USER_ID), eq(snapshots.snapshotDate, snapshotDate)))
      .limit(1);

    let snapshotId: string;
    if (existing.length > 0) {
      snapshotId = existing[0].snapshotId;
      console.log(`  Snapshot already exists (${snapshotId}), replacing holdings.`);
      await db.delete(holdings).where(eq(holdings.snapshotId, snapshotId));
    } else {
      snapshotId = randomUUID();
      await db.insert(snapshots).values({ snapshotId, userId: USER_ID, snapshotDate });
      console.log(`  Created snapshot ${snapshotId} for ${snapshotDate}.`);
    }

    // 3. Insert holdings
    await db.insert(holdings).values(
      rows.map((row) => ({
        holdingId:         randomUUID(),
        snapshotId,
        ticker:            row.ticker,
        broker:            row.broker,
        shares:            row.shares,
        sharePrice:        row.sharePrice,
        totalValue:        row.totalValue,
        costBasis:         row.costBasis,
        totalValueGainPct: row.totalValueGainPct,
        return1d:          row.return1d,
        return1m:          row.return1m,
        return6m:          row.return6m,
      }))
    );
    console.log(`  Inserted ${rows.length} holdings.\n`);
  }

  console.log("Backfill complete.");
  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
