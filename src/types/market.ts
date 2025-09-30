export interface Market {
  id: string;
  question: string;
  conditionId?: string;
  slug: string;
  endDate?: string;
  startDate?: string;
  gameStartTime?: string;
  image?: string;
  icon?: string;
  description?: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  volumeNum?: number;
  liquidity: string;
  liquidityNum?: number;
  questionId?: string;
  createdAt: string;
  updatedAt: string;
  clobRewards: Rewards[];
  rewardsMinSize: number;
  rewardsMaxSpread: number;
  spread: number;
}

export interface MarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  restricted: boolean;
  volume: string;
  liquidity: string;
  markets: Market[];
  createdAt: string;
  updatedAt: string;
  tags: Tags[];
}

export interface Tags {
  id: string;
  label: string;
  slug: string;
}

export interface Rewards {
  id: string;
  conditionId: string;
  assertAddress: string;
  rewardAmount: string;
  rewardsDailyRate: string;
  startDate: string;
  endDate: string;
}
export interface IndexerResult {
  markets: Market[];
  events: MarketEvent[];
  timestamp: number;
  success: boolean;
  error?: string;
}