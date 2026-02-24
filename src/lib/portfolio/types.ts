// src/lib/portfolio/types.ts

export interface PositionPnl {
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  pnl: number;
  pnlPct: number;
  isRealized: boolean;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalPnl: number;
  totalPnlPct: number;
  openPositions: number;
  closedPositions: number;
  winRate: number;
}

export interface PortfolioAnalytics {
  summary: PortfolioSummary;
  sectorAllocation: { sector: string; count: number; value: number }[];
  assetClassAllocation: { assetClass: string; count: number }[];
  avgHoldingDays: number;
  bestPosition: { tipId: string; pnlPct: number } | null;
  worstPosition: { tipId: string; pnlPct: number } | null;
}
