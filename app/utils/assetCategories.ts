export type AssetCategory =
  | "US Large Cap"
  | "US Small Cap"
  | "US Total Market"
  | "Bonds"
  | "Cash & Short-term"
  | "Other";

export const CATEGORY_COLORS: Record<AssetCategory, string> = {
  "US Large Cap": "#3b82f6",       // blue-500
  "US Small Cap": "#a855f7",       // violet-500
  "US Total Market": "#06b6d4",    // cyan-500
  "Bonds": "#f59e0b",              // amber-500
  "Cash & Short-term": "#10b981",  // emerald-500
  "Other": "#6b7280",              // gray-500
};

const TICKER_CATEGORIES: Record<string, AssetCategory> = {
  // US Large Cap — index funds & individual large-cap stocks
  VOO: "US Large Cap",
  SWPPX: "US Large Cap",
  FXAIX: "US Large Cap",
  SCHX: "US Large Cap",
  QQQM: "US Large Cap",
  META: "US Large Cap",
  NVDA: "US Large Cap",
  GOOGL: "US Large Cap",
  MSFT: "US Large Cap",
  HOOD: "US Large Cap",
  // US Small Cap
  SCHA: "US Small Cap",
  // US Total Market
  VTI: "US Total Market",
  // Bonds
  TLT: "Bonds",
  // Cash & Short-term
  SGOV: "Cash & Short-term",
  USTBILL1: "Cash & Short-term",
  USTBILL2: "Cash & Short-term",
  DEPOSIT: "Cash & Short-term",
};

export function getCategory(ticker: string): AssetCategory {
  return TICKER_CATEGORIES[ticker] ?? "Other";
}
