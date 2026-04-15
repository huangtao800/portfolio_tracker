import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import YahooFinance from "yahoo-finance2";
import { authOptions } from "../../lib/auth";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey", "ripHistorical"] });

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period1 = searchParams.get("period1");
  const period2 = searchParams.get("period2");
  if (!period1 || !period2) return NextResponse.json({ error: "Missing period1 or period2" }, { status: 400 });

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const chartResult = await yahooFinance.chart("VOO", { period1, period2, interval: "1d" });
      const quotes = chartResult?.quotes;
      if (!quotes || quotes.length === 0) return NextResponse.json({});

      const prices: Record<string, number> = {};
      for (const row of quotes) {
        if (row.close != null) {
          prices[row.date.toISOString().substring(0, 10)] = row.close;
        }
      }
      return NextResponse.json(prices);
    } catch (err) {
      console.error(`[benchmark] attempt ${attempt} failed:`, err);
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }

  return NextResponse.json({});
}
