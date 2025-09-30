// Auto-generated database types
// Generated at: 2025-09-30T00:18:29.519Z
// Do not edit manually - run 'bun run scripts/generate-types.ts' to regenerate

// Custom enums (define manually as needed)
export type WinnerEnum = 'UNRESOLVED' | 'OUTCOME1' | 'OUTCOME2' | 'DRAW';


// market_events table
export interface MarketEventsDB {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  active: boolean;
  closed: boolean;
  restricted: boolean;
  volume: string | null;
  liquidity: string | null;
  created_at: Date;
  updated_at: Date;
}

// markets table
export interface MarketsDB {
  id: string;
  question: string;
  outcome1: string;
  outcome2: string;
  price1: string;
  price2: string;
  winner: WinnerEnum;
  volume: string | null;
  image: string | null;
  description: string | null;
  start_time: Date | null;
  end_time: Date | null;
  game_start_time: Date | null;
  polymarket_id: string | null;
  created_at: Date;
  updated_at: Date;
  market_event_id: string | null;
}

// parlay_bets table
export interface ParlayBetsDB {
  id: string;
  bettor_id: string;
  stake: string;
  max_payout: string;
  expiry: Date;
  created_at: Date;
}

// parlay_legs table
export interface ParlayLegsDB {
  id: string;
  parlay_id: string;
  market_id: string;
  selection: string;
  entry_price: string;
  created_at: Date;
}

// user_balance table
export interface UserBalanceDB {
  id: string;
  user_id: string;
  balance: string;
  created_at: Date;
  updated_at: Date;
}

// Insert types (omit auto-generated fields)
export type MarketEventsInsert = Omit<MarketEventsDB, 'created_at' | 'updated_at'> & {
  created_at?: Date;
  updated_at?: Date;
};

export type MarketsInsert = Omit<MarketsDB, 'created_at' | 'updated_at'> & {
  created_at?: Date;
  updated_at?: Date;
};

export type ParlayBetsInsert = Omit<ParlayBetsDB, 'id' | 'created_at'> & {
  id?: string;
  created_at?: Date;
};

export type ParlayLegsInsert = Omit<ParlayLegsDB, 'id' | 'created_at'> & {
  id?: string;
  created_at?: Date;
};

export type UserBalanceInsert = Omit<UserBalanceDB, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: Date;
  updated_at?: Date;
};

// Update types (partial updates)
export type MarketEventsUpdate = Partial<Omit<MarketEventsDB, 'id' | 'created_at'>> & {
  updated_at?: Date;
};

export type MarketsUpdate = Partial<Omit<MarketsDB, 'id' | 'created_at'>> & {
  updated_at?: Date;
};

export type ParlayBetsUpdate = Partial<Omit<ParlayBetsDB, 'id' | 'created_at'>> & {
};

export type ParlayLegsUpdate = Partial<Omit<ParlayLegsDB, 'id' | 'created_at'>> & {
};

export type UserBalanceUpdate = Partial<Omit<UserBalanceDB, 'id' | 'created_at'>> & {
  updated_at?: Date;
};

// Utility types for database operations
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rowsAffected?: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}