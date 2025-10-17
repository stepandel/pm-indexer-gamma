// Database types - now using Prisma-generated types for new 1:1 API schema
import type {
  markets,
  market_events,
  tags,
  market_event_tags,
  market_tags,
  Prisma
} from '@prisma/client';

// Re-export Prisma types with DB suffix for compatibility
export type MarketsDB = markets;
export type MarketEventsDB = market_events;
export type TagsDB = tags;
export type MarketEventTagsDB = market_event_tags;
export type MarketTagsDB = market_tags;

// Create insert types (omit auto-generated fields)
export type MarketsInsert = Omit<markets, 'indexed_at' | 'last_updated'> & {
  indexed_at?: Date;
  last_updated?: Date;
};

export type MarketEventsInsert = Omit<market_events, 'indexed_at' | 'last_updated'> & {
  indexed_at?: Date;
  last_updated?: Date;
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

// Update types (partial updates)
export type MarketsUpdate = Partial<Omit<markets, 'id' | 'indexed_at'>> & {
  last_updated?: Date;
};

export type MarketEventsUpdate = Partial<Omit<market_events, 'id' | 'indexed_at'>> & {
  last_updated?: Date;
};

export type TagsUpdate = Partial<Omit<tags, 'id' | 'created_at'>> & {
  updated_at?: Date;
};

export type MarketEventTagsUpdate = Partial<Omit<market_event_tags, 'market_event_id' | 'tag_id' | 'created_at'>>;

export type MarketTagsUpdate = Partial<Omit<market_tags, 'market_id' | 'tag_id' | 'created_at'>>;

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