import { TimeSeriesData } from '../types/portfolio';

export interface PerformanceMetrics {
  totalReturn: number;
  percentageReturn: number;
  periodStart: string;
  periodEnd: string;
  startValue: number;
  endValue: number;
}

export function calculatePerformance(data: TimeSeriesData[]): PerformanceMetrics {
  if (data.length < 2) {
    return {
      totalReturn: 0,
      percentageReturn: 0,
      periodStart: '',
      periodEnd: '',
      startValue: 0,
      endValue: 0,
    };
  }

  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const startValue = sortedData[0].netWorth;
  const endValue = sortedData[sortedData.length - 1].netWorth;
  const totalReturn = endValue - startValue;
  const percentageReturn = (totalReturn / startValue) * 100;

  return {
    totalReturn,
    percentageReturn,
    periodStart: sortedData[0].date,
    periodEnd: sortedData[sortedData.length - 1].date,
    startValue,
    endValue,
  };
} 