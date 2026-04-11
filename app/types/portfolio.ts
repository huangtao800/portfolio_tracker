export interface Holding {
  ticker: string;
  holdingName: string;
  exchange: string;
  broker: string;
  shares: number;
  sharePrice: number | null;
  totalValue: number;
  totalValueGainPercent: number | null;
  costBasis: number | null;
  return1D: number | null;
  return1M: number | null;
  return6M: number | null;
  date: string;
}

export interface AggregatedHolding {
  ticker: string;
  holdingName: string;
  totalShares: number;
  totalValue: number;
  costBasis: number | null;
  gain: number | null;
  gainPercent: number | null;
  return1D: number | null;
  return1M: number | null;
  return6M: number | null;
  brokers: string[];
}

export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  totalGain: number;
  totalGainPercent: number;
  date: string;
}

export interface PortfolioData {
  holdings: Holding[];
  aggregated: AggregatedHolding[];
  summary: PortfolioSummary;
}

export interface TimeSeriesPoint {
  date: string;
  totalValue: number;
  totalCostBasis: number;
}
