// Database types - now using Prisma-generated types with compatibility layer
// This file re-exports Prisma types and provides legacy compatibility

import type {
  market_events,
  markets,
  tags,
  market_event_tags,
  market_tags,
  user_balance,
  winner_enum,
  Prisma
} from '@prisma/client';

// Helper type to convert Decimal fields to string for compatibility
type DecimalToString<T> = {
  [P in keyof T]: T[P] extends Prisma.Decimal | null
    ? string | null
    : T[P] extends Prisma.Decimal
    ? string
    : T[P];
};

// Re-export Prisma types with DB suffix for compatibility
// Convert Decimal fields to strings for compatibility with existing code
export type MarketEventsDB = DecimalToString<market_events>;
export type MarketsDB = DecimalToString<markets>;
export type TagsDB = tags;
export type MarketEventTagsDB = market_event_tags;
export type MarketTagsDB = market_tags;
export type UserBalanceDB = DecimalToString<user_balance>;

// Re-export enum
export type WinnerEnum = winner_enum;

// Create insert types (omit auto-generated fields)
export type MarketEventsInsert = DecimalToString<Omit<market_events, 'created_at' | 'updated_at'>> & {
  created_at?: Date;
  updated_at?: Date;
};

export type MarketsInsert = DecimalToString<Omit<markets, 'created_at' | 'updated_at'>> & {
  created_at?: Date;
  updated_at?: Date;
};

export type TagsInsert = Omit<tags, 'created_at' | 'updated_at'> & {
  created_at?: Date;
  updated_at?: Date;
};

export type MarketEventTagsInsert = Omit<market_event_tags, 'created_at'> & {
  created_at?: Date;
};

export type MarketTagsInsert = Omit<market_tags, 'created_at'> & {
  created_at?: Date;
};

export type UserBalanceInsert = DecimalToString<Omit<user_balance, 'id' | 'created_at' | 'updated_at'>> & {
  id?: string;
  created_at?: Date;
  updated_at?: Date;
};

// Update types (partial updates)
export type MarketEventsUpdate = Partial<DecimalToString<Omit<market_events, 'id' | 'created_at'>>> & {
  updated_at?: Date;
};

export type MarketsUpdate = Partial<DecimalToString<Omit<markets, 'id' | 'created_at'>>> & {
  updated_at?: Date;
};

export type TagsUpdate = Partial<Omit<tags, 'id' | 'created_at'>> & {
  updated_at?: Date;
};

export type MarketEventTagsUpdate = Partial<Omit<market_event_tags, 'market_event_id' | 'tag_id' | 'created_at'>>;

export type MarketTagsUpdate = Partial<Omit<market_tags, 'market_id' | 'tag_id' | 'created_at'>>;

export type UserBalanceUpdate = Partial<DecimalToString<Omit<user_balance, 'id' | 'created_at'>>> & {
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

// Re-export Prisma types for advanced usage
export type { Prisma };