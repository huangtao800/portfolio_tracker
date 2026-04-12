import "server-only";
import YahooFinance from "yahoo-finance2";

export type AssetCategory =
  | "US Large Cap"
  | "US Small Cap"
  | "US Total Market"
  | "Bonds"
  | "Cash & Short-term"
  | "Other";

export const CATEGORY_COLORS: Record<AssetCategory, string> = {
  "US Large Cap": "#3b82f6",
  "US Small Cap": "#a855f7",
  "US Total Market": "#06b6d4",
  Bonds: "#f59e0b",
  "Cash & Short-term": "#10b981",
  Other: "#6b7280",
};

// Fallback map for tickers Yahoo Finance can't classify
const MANUAL_MAP: Record<string, AssetCategory> = {
  VOO: "US Large Cap",
  SWPPX: "US Large Cap",
  FXAIX: "US Large Cap",
  SCHX: "US Large Cap",
  QQQM: "US Large Cap",
  AAPL: "US Large Cap",
  AMZN: "US Large Cap",
  META: "US Large Cap",
  NVDA: "US Large Cap",
  GOOGL: "US Large Cap",
  MSFT: "US Large Cap",
  HOOD: "US Large Cap",
  SCHA: "US Small Cap",
  VTI: "US Total Market",
  TLT: "Bonds",
  SGOV: "Cash & Short-term",
  SPAXX: "Cash & Short-term",
  USTBILL: "Cash & Short-term",
  USTBILL1: "Cash & Short-term",
  USTBILL2: "Cash & Short-term",
  DEPOSIT: "Cash & Short-term",
};

export function getCategory(ticker: string): AssetCategory {
  return MANUAL_MAP[ticker] ?? "Other";
}

// Morningstar category name → AssetCategory
const MORNINGSTAR_MAP: Record<string, AssetCategory> = {
  "Large Blend": "US Large Cap",
  "Large Growth": "US Large Cap",
  "Large Value": "US Large Cap",
  "Mid-Cap Blend": "US Large Cap",
  "Mid-Cap Growth": "US Large Cap",
  "Mid-Cap Value": "US Large Cap",
  "Small Blend": "US Small Cap",
  "Small Growth": "US Small Cap",
  "Small Value": "US Small Cap",
  "Long Government": "Bonds",
  "Intermediate Government": "Bonds",
  "Short Government": "Cash & Short-term",
  "Intermediate Core Bond": "Bonds",
  "Intermediate Core-Plus Bond": "Bonds",
  "Corporate Bond": "Bonds",
  "Multisector Bond": "Bonds",
  "High Yield Bond": "Bonds",
  "Inflation-Protected Bond": "Bonds",
  "Short-Term Bond": "Cash & Short-term",
  "Ultrashort Bond": "Cash & Short-term",
  "Money Market-Taxable": "Cash & Short-term",
  "Money Market-Tax-Free": "Cash & Short-term",
};

function fuzzyMap(categoryName: string): AssetCategory {
  const s = categoryName.toLowerCase();
  if (s.includes("small")) return "US Small Cap";
  if (s.includes("large") || s.includes("mid")) return "US Large Cap";
  if (s.includes("bond") || s.includes("government") || s.includes("treasury"))
    return "Bonds";
  if (s.includes("ultrashort") || s.includes("money market") || s.includes("short-term"))
    return "Cash & Short-term";
  return "Other";
}

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const cache = new Map<string, AssetCategory>();

async function fetchCategory(ticker: string): Promise<AssetCategory | null> {
  try {
    const result = await yahooFinance.quoteSummary(
      ticker,
      { modules: ["price", "fundProfile"] },
      { validateResult: false }
    );
    const quoteType = result.price?.quoteType;

    if (quoteType === "ETF" || quoteType === "MUTUALFUND") {
      const cat = (result.fundProfile as { categoryName?: string } | undefined)
        ?.categoryName;
      if (cat) return MORNINGSTAR_MAP[cat] ?? fuzzyMap(cat);
    }

    if (quoteType === "EQUITY") {
      const marketCap = result.price?.marketCap;
      if (typeof marketCap === "number") {
        return marketCap >= 2_000_000_000 ? "US Large Cap" : "US Small Cap";
      }
      return "US Large Cap";
    }
  } catch {
    // fall through
  }
  return null;
}

export async function buildCategoryMap(
  tickers: string[]
): Promise<Record<string, AssetCategory>> {
  const uncached = tickers.filter((t) => !cache.has(t));

  if (uncached.length > 0) {
    const results = await Promise.allSettled(
      uncached.map(async (ticker) => ({
        ticker,
        category: await fetchCategory(ticker),
      }))
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        const { ticker, category } = r.value;
        cache.set(ticker, category ?? getCategory(ticker));
      }
    }
  }

  return Object.fromEntries(
    tickers.map((t) => [t, cache.get(t) ?? getCategory(t)])
  );
}
