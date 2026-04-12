import { NextResponse } from "next/server";
import { syncCsvToDb } from "../../../lib/sync";

export async function POST() {
  try {
    await syncCsvToDb();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sync] API error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
