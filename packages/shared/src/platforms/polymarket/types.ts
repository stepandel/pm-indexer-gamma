// Polymarket API response types - 1:1 mapping with API
export interface Market {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource: string;
  endDate: string;
  liquidity: string;
  startDate: string;
  image: string;
  icon: string;
  description: string;
  outcomes: string; // JSON array: ["Yes", "No"]
  outcomePrices: string; // JSON array: ["0.891", "0.109"]
  volume: string;
  active: boolean;
  closed: boolean;
  marketMakerAddress: string;
  createdAt: string;
  updatedAt: string;
  new: boolean;
  featured: boolean;
  submitted_by: string;
  archived: boolean;
  resolvedBy: string;
  restricted: boolean;
  groupItemTitle: string;
  groupItemThreshold: string;
  questionID: string;
  enableOrderBook: boolean;
  orderPriceMinTickSize: number;
  orderMinSize: number;
  volumeNum: number;
  liquidityNum: number;
  endDateIso: string;
  startDateIso: string;
  hasReviewedDates: boolean;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  clobTokenIds: string; // JSON array
  umaBond: string;
  umaReward: string;
  volume24hrClob: number;
  volume1wkClob: number;
  volume1moClob: number;
  volume1yrClob: number;
  volumeClob: number;
  liquidityClob: number;
  customLiveness: number;
  acceptingOrders: boolean;
  negRisk: boolean;
  negRiskMarketID: string;
  negRiskRequestID: string;
}

export interface MarketEvent {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  description: string;
  resolutionSource: string;
  startDate: string;
  creationDate: string;
  endDate: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  liquidity: number;
  volume: number;
  openInterest: number;
  sortBy: string;
  createdAt: string;
  updatedAt: string;
  competitive: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  enableOrderBook: boolean;
  liquidityClob: number;
  negRisk: boolean;
  negRiskMarketID: string;
  commentCount: number;
  markets: Market[];
  tags: Tags[];
}

export interface Tags {
  id: string;
  label: string;
  slug: string;
}

export interface IndexerResult {
  markets: Market[];
  events: MarketEvent[];
  timestamp: number;
  success: boolean;
  error?: string;
}