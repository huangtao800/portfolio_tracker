export interface PortfolioEntry {
  date: string;
  accountName: string;
  accountNumber: string;
  symbol: string;
  description: string;
  quantity: number;
  lastPrice: number;
  currentValue: number;
  costBasisTotal: number;
  averageCostBasis: number;
}

export interface TimeSeriesData {
  date: string;
  netWorth: number;
}

export interface AssetAllocation {
  assetClass: string;
  value: number;
  percentage: number;
  holdings: PortfolioEntry[];
}

export type TimeRange = 'ytd' | '30d' | '6m' | '1y' | '3y' | '5y' | 'all'; 