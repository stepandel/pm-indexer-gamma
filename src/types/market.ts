export interface Market {
  id: string;
  question: string;
  conditionId?: string;
  slug: string;
  endDate?: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  volumeNum?: number;
  liquidity: string;
  liquidityNum?: number;
  category?: string;
  marketType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketEvent {
  id: string;
  title: string;
  slug: string;
  markets: Market[];
  createdAt: string;
  updatedAt: string;
}

export interface IndexerResult {
  markets: Market[];
  events: MarketEvent[];
  timestamp: number;
  success: boolean;
  error?: string;
}