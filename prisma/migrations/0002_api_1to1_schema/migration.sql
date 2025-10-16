-- Migration to match Polymarket API 1:1
-- This migration updates the markets table to match the Polymarket API response exactly

-- Drop existing tables that are being restructured
DROP TABLE IF EXISTS public.user_balance CASCADE;
DROP TABLE IF EXISTS public.parlay_legs CASCADE;
DROP TABLE IF EXISTS public.parlay_bets CASCADE;
DROP TABLE IF EXISTS public.market_entity CASCADE;
DROP TABLE IF EXISTS public.entity CASCADE;
DROP TABLE IF EXISTS public.event_date CASCADE;

-- Drop existing winner enum and recreate markets table
DROP TYPE IF EXISTS public.winner_enum CASCADE;

-- Recreate markets table with new structure
DROP TABLE IF EXISTS public.markets CASCADE;

CREATE TABLE public.markets (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    condition_id TEXT,
    slug TEXT NOT NULL,
    resolution_source TEXT,

    -- Dates
    end_date TIMESTAMPTZ,
    start_date TIMESTAMPTZ,

    -- Media
    image TEXT,
    icon TEXT,
    description TEXT,

    -- API response fields (JSON strings)
    outcomes TEXT NOT NULL,
    outcome_prices TEXT NOT NULL,

    -- Financial data
    volume TEXT NOT NULL,
    liquidity TEXT NOT NULL,
    volume_num REAL,
    liquidity_num REAL,
    volume_24hr REAL,
    volume_1wk REAL,
    volume_1mo REAL,
    volume_1yr REAL,
    volume_clob REAL,
    liquidity_clob REAL,
    volume_24hr_clob REAL,
    volume_1wk_clob REAL,
    volume_1mo_clob REAL,
    volume_1yr_clob REAL,

    -- Status flags
    active BOOLEAN DEFAULT true NOT NULL,
    closed BOOLEAN DEFAULT false NOT NULL,
    archived BOOLEAN DEFAULT false NOT NULL,
    new BOOLEAN DEFAULT false NOT NULL,
    featured BOOLEAN DEFAULT false NOT NULL,
    restricted BOOLEAN DEFAULT false NOT NULL,
    accepting_orders BOOLEAN,
    neg_risk BOOLEAN,

    -- Market maker and addresses
    market_maker_address TEXT,
    submitted_by TEXT,
    resolved_by TEXT,

    -- Grouping
    group_item_title TEXT,
    group_item_threshold TEXT,

    -- Trading parameters
    question_id TEXT,
    enable_order_book BOOLEAN,
    order_price_min_tick_size REAL,
    order_min_size REAL,

    -- Date helpers
    end_date_iso TEXT,
    start_date_iso TEXT,
    has_reviewed_dates BOOLEAN,

    -- CLOB token IDs
    clob_token_ids TEXT,

    -- UMA parameters
    uma_bond TEXT,
    uma_reward TEXT,
    custom_liveness INTEGER,

    -- Neg risk fields
    neg_risk_market_id TEXT,
    neg_risk_request_id TEXT,

    -- Timestamps from API
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,

    -- Internal tracking
    indexed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Relations
    market_event_id TEXT
);

-- Create indexes for the markets table
CREATE INDEX idx_markets_market_event_id ON public.markets(market_event_id);
CREATE INDEX idx_markets_active ON public.markets(active);
CREATE INDEX idx_markets_closed ON public.markets(closed);
CREATE INDEX idx_markets_condition_id ON public.markets(condition_id);
CREATE INDEX idx_markets_slug ON public.markets(slug);

-- Keep market_events table (simplified)
CREATE TABLE IF NOT EXISTS public.market_events (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    icon TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    closed BOOLEAN DEFAULT false NOT NULL,
    restricted BOOLEAN DEFAULT false NOT NULL,
    volume TEXT DEFAULT '0',
    liquidity TEXT DEFAULT '0',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Keep tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Market to tag relationships
CREATE TABLE IF NOT EXISTS public.market_tags (
    market_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (market_id, tag_id)
);

-- Event to tag relationships
CREATE TABLE IF NOT EXISTS public.market_event_tags (
    market_event_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (market_event_id, tag_id)
);

-- Create indexes for tag relationships
CREATE INDEX idx_market_tags_market_id ON public.market_tags(market_id);
CREATE INDEX idx_market_tags_tag_id ON public.market_tags(tag_id);
CREATE INDEX idx_market_event_tags_market_event_id ON public.market_event_tags(market_event_id);
CREATE INDEX idx_market_event_tags_tag_id ON public.market_event_tags(tag_id);

-- Add foreign key constraints
ALTER TABLE public.markets ADD CONSTRAINT fk_markets_market_event_id
    FOREIGN KEY (market_event_id) REFERENCES public.market_events(id);

ALTER TABLE public.market_tags ADD CONSTRAINT fk_market_tags_market_id
    FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;
ALTER TABLE public.market_tags ADD CONSTRAINT fk_market_tags_tag_id
    FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;

ALTER TABLE public.market_event_tags ADD CONSTRAINT fk_market_event_tags_market_event_id
    FOREIGN KEY (market_event_id) REFERENCES public.market_events(id) ON DELETE CASCADE;
ALTER TABLE public.market_event_tags ADD CONSTRAINT fk_market_event_tags_tag_id
    FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;