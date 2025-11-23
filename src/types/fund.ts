export interface Fund {
  id: string;
  name: string;
  strategy: string;
  manager: string;
  latestNavDate: Date;
  cumulativeReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  totalAssets: number;
  standingAssets: number;
  cashAllocation: number;
  status: string;
  establishmentDate?: Date;
  cost?: number;
  scale?: number;
}

export interface FundNavHistory {
  id: string;
  fundId: string;
  navDate: Date;
  unitNav: number;
  cumulativeNav: number;
  dailyReturn: number;
  totalAssets: number;
  status: string;
  recordTime: Date;
  cost?: number;
  marketValue?: number;
  positionChange?: number;
}

export interface StrategyStats {
  strategy: string;
  fundCount: number;
  averageReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  totalAssets: number;
}

export interface ManagerStats {
  manager: string;
  fundCount: number;
  totalAssets: number;
  averageReturn: number;
  bestFundName: string;
  bestFundReturn: number;
}

export interface FOFAnalysis {
  name: string;
  return: number;
  totalAssets: number;
  subHoldings: FOFSHolding[];
  assetAllocation: AssetAllocation;
  performanceVsBenchmark: PerformancePoint[];
}

export interface FOFSHolding {
  fundName: string;
  weight: number;
  return: number;
  contribution: number;
  latestNav: number;
}

export interface AssetAllocation {
  stocks: number;
  bonds: number;
  alternatives: number;
}

export interface PerformancePoint {
  date: Date;
  fofValue: number;
  benchmarkValue: number;
}

export interface DateRangeFilter {
  start: Date;
  end: Date;
}

export type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export type SortOrder = 'asc' | 'desc';
export type SortField = 'name' | 'return' | 'sharpe' | 'maxDrawdown' | 'assets';