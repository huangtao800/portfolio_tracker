import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { authOptions } from "../../lib/auth";
import { db } from "../../lib/db";
import { securities, snapshots, holdings } from "../../lib/schema";
import { parseCsv } from "../../utils/csvParser";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const content = await file.text();
  const rows = parseCsv(content);
  if (rows.length === 0)
    return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });

  // Validate all rows have a valid date
  const snapshotDate = rows[0].date?.trim() ?? "";
  if (!DATE_RE.test(snapshotDate))
    return NextResponse.json(
      { error: "CSV is missing a valid date column (expected YYYY-MM-DD)." },
      { status: 400 }
    );

  // Group rows by accountId
  const byAccount = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!byAccount.has(row.accountId)) byAccount.set(row.accountId, []);
    byAccount.get(row.accountId)!.push(row);
  }

  // Upsert securities for all rows up front
  for (const row of rows) {
    const [existing] = await db
      .select({ securityId: securities.securityId })
      .from(securities)
      .where(eq(securities.ticker, row.ticker))
      .limit(1);

    row.securityId = existing?.securityId ?? randomUUID();

    await db
      .insert(securities)
      .values({ securityId: row.securityId, ticker: row.ticker, name: row.name, exchange: row.exchange || null })
      .onDuplicateKeyUpdate({ set: { name: row.name, exchange: row.exchange || null } });
  }

  // Create or replace a snapshot per account
  let totalRows = 0;
  for (const [accountId, accountRows] of byAccount) {
    const existing = await db
      .select({ snapshotId: snapshots.snapshotId })
      .from(snapshots)
      .where(and(eq(snapshots.accountId, accountId), eq(snapshots.snapshotDate, snapshotDate)))
      .limit(1);

    let snapshotId: string;
    if (existing.length > 0) {
      snapshotId = existing[0].snapshotId;
      await db.delete(holdings).where(eq(holdings.snapshotId, snapshotId));
    } else {
      snapshotId = randomUUID();
      await db.insert(snapshots).values({ snapshotId, userId, accountId, snapshotDate });
    }

    await db.insert(holdings).values(
      accountRows.map((row) => ({
        holdingId:         randomUUID(),
        snapshotId,
        ticker:            row.ticker,
        securityId:        row.securityId!,
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

    totalRows += accountRows.length;
  }

  return NextResponse.json({ ok: true, rows: totalRows, accounts: byAccount.size, date: snapshotDate });
}
