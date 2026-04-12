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

  // Determine snapshot date from the CSV date column only
  const snapshotDate = rows[0].date?.trim() ?? "";
  if (!DATE_RE.test(snapshotDate))
    return NextResponse.json(
      { error: "CSV is missing a valid date column (expected YYYY-MM-DD)." },
      { status: 400 }
    );

  // If a snapshot for this date already exists, replace its holdings
  const existing = await db
    .select({ snapshotId: snapshots.snapshotId })
    .from(snapshots)
    .where(and(eq(snapshots.userId, userId), eq(snapshots.snapshotDate, new Date(snapshotDate))))
    .limit(1);

  let snapshotId: string;
  if (existing.length > 0) {
    snapshotId = existing[0].snapshotId;
    await db.delete(holdings).where(eq(holdings.snapshotId, snapshotId));
  } else {
    snapshotId = randomUUID();
    await db.insert(snapshots).values({ snapshotId, userId, snapshotDate: new Date(snapshotDate) });
  }

  // Upsert securities
  for (const row of rows) {
    await db
      .insert(securities)
      .values({ ticker: row.ticker, name: row.name, exchange: row.exchange || null })
      .onDuplicateKeyUpdate({ set: { name: row.name, exchange: row.exchange || null } });
  }

  // Insert holdings
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

  return NextResponse.json({ ok: true, rows: rows.length, date: snapshotDate });
}
