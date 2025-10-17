-- Migration to update market_events table to match Polymarket Events API 1:1

-- Drop existing market_events table and recreate with new structure
DROP TABLE IF EXISTS public.market_events CASCADE;

CREATE TABLE public.market_events (
    id TEXT PRIMARY KEY,
    ticker TEXT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    resolution_source TEXT,

    -- Dates
    start_date TIMESTAMPTZ,
    creation_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,

    -- Media
    image TEXT,
    icon TEXT,

    -- Status flags
    active BOOLEAN DEFAULT true NOT NULL,
    closed BOOLEAN DEFAULT false NOT NULL,
    archived BOOLEAN DEFAULT false NOT NULL,
    new BOOLEAN DEFAULT false NOT NULL,
    featured BOOLEAN DEFAULT false NOT NULL,
    restricted BOOLEAN DEFAULT false NOT NULL,

    -- Financial data
    liquidity REAL DEFAULT 0,
    volume REAL DEFAULT 0,
    open_interest REAL DEFAULT 0,
    competitive REAL DEFAULT 0,
    volume_24hr REAL,
    volume_1wk REAL,
    volume_1mo REAL,
    volume_1yr REAL,
    liquidity_clob REAL,

    -- Settings
    sort_by TEXT,
    enable_order_book BOOLEAN,
    neg_risk BOOLEAN,
    neg_risk_market_id TEXT,

    -- Community metrics
    comment_count INTEGER DEFAULT 0,

    -- Timestamps from API
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,

    -- Internal tracking
    indexed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for the market_events table
CREATE INDEX idx_market_events_active ON public.market_events(active);
CREATE INDEX idx_market_events_closed ON public.market_events(closed);
CREATE INDEX idx_market_events_featured ON public.market_events(featured);
CREATE INDEX idx_market_events_ticker ON public.market_events(ticker);

-- Recreate market_event_tags table to maintain relationships
CREATE TABLE IF NOT EXISTS public.market_event_tags (
    market_event_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (market_event_id, tag_id)
);

-- Create indexes for tag relationships
CREATE INDEX idx_market_event_tags_market_event_id ON public.market_event_tags(market_event_id);
CREATE INDEX idx_market_event_tags_tag_id ON public.market_event_tags(tag_id);

-- Add foreign key constraints
ALTER TABLE public.markets ADD CONSTRAINT fk_markets_market_event_id
    FOREIGN KEY (market_event_id) REFERENCES public.market_events(id);

ALTER TABLE public.market_event_tags ADD CONSTRAINT fk_market_event_tags_market_event_id
    FOREIGN KEY (market_event_id) REFERENCES public.market_events(id) ON DELETE CASCADE;
ALTER TABLE public.market_event_tags ADD CONSTRAINT fk_market_event_tags_tag_id
    FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;