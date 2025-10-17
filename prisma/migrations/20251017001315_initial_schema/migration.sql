-- Create schemas for multi-platform support
CREATE SCHEMA IF NOT EXISTS "polymarket";
CREATE SCHEMA IF NOT EXISTS "kalshi";

-- CreateTable: Polymarket Markets
CREATE TABLE "polymarket"."markets" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "conditionId" TEXT,
    "slug" TEXT NOT NULL,
    "resolutionSource" TEXT,
    "endDate" TIMESTAMPTZ(6),
    "startDate" TIMESTAMPTZ(6),
    "image" TEXT,
    "icon" TEXT,
    "description" TEXT,
    "outcomes" TEXT NOT NULL,
    "outcomePrices" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "liquidity" TEXT NOT NULL,
    "volumeNum" DOUBLE PRECISION,
    "liquidityNum" DOUBLE PRECISION,
    "volume24hr" DOUBLE PRECISION,
    "volume1wk" DOUBLE PRECISION,
    "volume1mo" DOUBLE PRECISION,
    "volume1yr" DOUBLE PRECISION,
    "volumeClob" DOUBLE PRECISION,
    "liquidityClob" DOUBLE PRECISION,
    "volume24hrClob" DOUBLE PRECISION,
    "volume1wkClob" DOUBLE PRECISION,
    "volume1moClob" DOUBLE PRECISION,
    "volume1yrClob" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "new" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "restricted" BOOLEAN NOT NULL DEFAULT false,
    "acceptingOrders" BOOLEAN,
    "negRisk" BOOLEAN,
    "marketMakerAddress" TEXT,
    "submittedBy" TEXT,
    "resolvedBy" TEXT,
    "groupItemTitle" TEXT,
    "groupItemThreshold" TEXT,
    "questionID" TEXT,
    "enableOrderBook" BOOLEAN,
    "orderPriceMinTickSize" DOUBLE PRECISION,
    "orderMinSize" DOUBLE PRECISION,
    "endDateIso" TEXT,
    "startDateIso" TEXT,
    "hasReviewedDates" BOOLEAN,
    "clobTokenIds" TEXT,
    "umaBond" TEXT,
    "umaReward" TEXT,
    "customLiveness" INTEGER,
    "negRiskMarketID" TEXT,
    "negRiskRequestID" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "indexed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "market_event_id" TEXT,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Polymarket Market Events
CREATE TABLE "polymarket"."market_events" (
    "id" TEXT NOT NULL,
    "ticker" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resolutionSource" TEXT,
    "startDate" TIMESTAMPTZ(6),
    "creationDate" TIMESTAMPTZ(6),
    "endDate" TIMESTAMPTZ(6),
    "image" TEXT,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "new" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "restricted" BOOLEAN NOT NULL DEFAULT false,
    "liquidity" DOUBLE PRECISION DEFAULT 0,
    "volume" DOUBLE PRECISION DEFAULT 0,
    "openInterest" DOUBLE PRECISION DEFAULT 0,
    "competitive" DOUBLE PRECISION DEFAULT 0,
    "volume24hr" DOUBLE PRECISION,
    "volume1wk" DOUBLE PRECISION,
    "volume1mo" DOUBLE PRECISION,
    "volume1yr" DOUBLE PRECISION,
    "liquidityClob" DOUBLE PRECISION,
    "sortBy" TEXT,
    "enableOrderBook" BOOLEAN,
    "negRisk" BOOLEAN,
    "negRiskMarketID" TEXT,
    "commentCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "indexed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Polymarket Tags
CREATE TABLE "polymarket"."tags" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Polymarket Market Tags
CREATE TABLE "polymarket"."market_tags" (
    "market_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_tags_pkey" PRIMARY KEY ("market_id","tag_id")
);

-- CreateTable: Polymarket Market Event Tags
CREATE TABLE "polymarket"."market_event_tags" (
    "market_event_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_event_tags_pkey" PRIMARY KEY ("market_event_id","tag_id")
);

-- CreateTable: Kalshi Markets
CREATE TABLE "kalshi"."markets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "closeDate" TIMESTAMPTZ(6),
    "openDate" TIMESTAMPTZ(6),
    "status" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "canCloseEarly" BOOLEAN,
    "lastPrice" DOUBLE PRECISION,
    "volume" INTEGER DEFAULT 0,
    "openInterest" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "indexed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kalshi_markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Kalshi Events
CREATE TABLE "kalshi"."events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "indexed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kalshi_events_pkey" PRIMARY KEY ("id")
);

-- Polymarket Indexes
CREATE INDEX "idx_polymarket_markets_market_event_id" ON "polymarket"."markets"("market_event_id");
CREATE INDEX "idx_polymarket_markets_active" ON "polymarket"."markets"("active");
CREATE INDEX "idx_polymarket_markets_closed" ON "polymarket"."markets"("closed");
CREATE INDEX "idx_polymarket_markets_condition_id" ON "polymarket"."markets"("conditionId");
CREATE INDEX "idx_polymarket_markets_slug" ON "polymarket"."markets"("slug");

CREATE UNIQUE INDEX "market_events_slug_key" ON "polymarket"."market_events"("slug");
CREATE INDEX "idx_polymarket_market_events_active" ON "polymarket"."market_events"("active");
CREATE INDEX "idx_polymarket_market_events_closed" ON "polymarket"."market_events"("closed");
CREATE INDEX "idx_polymarket_market_events_featured" ON "polymarket"."market_events"("featured");
CREATE INDEX "idx_polymarket_market_events_ticker" ON "polymarket"."market_events"("ticker");

CREATE UNIQUE INDEX "tags_slug_key" ON "polymarket"."tags"("slug");
CREATE INDEX "idx_polymarket_market_tags_market_id" ON "polymarket"."market_tags"("market_id");
CREATE INDEX "idx_polymarket_market_tags_tag_id" ON "polymarket"."market_tags"("tag_id");
CREATE INDEX "idx_polymarket_market_event_tags_market_event_id" ON "polymarket"."market_event_tags"("market_event_id");
CREATE INDEX "idx_polymarket_market_event_tags_tag_id" ON "polymarket"."market_event_tags"("tag_id");

-- Kalshi Indexes
CREATE INDEX "idx_kalshi_markets_active" ON "kalshi"."markets"("active");
CREATE INDEX "idx_kalshi_markets_status" ON "kalshi"."markets"("status");
CREATE INDEX "idx_kalshi_markets_ticker" ON "kalshi"."markets"("ticker");
CREATE INDEX "idx_kalshi_markets_slug" ON "kalshi"."markets"("slug");
CREATE INDEX "idx_kalshi_events_ticker" ON "kalshi"."events"("ticker");

-- Polymarket Foreign Keys
ALTER TABLE "polymarket"."markets" ADD CONSTRAINT "markets_market_event_id_fkey" FOREIGN KEY ("market_event_id") REFERENCES "polymarket"."market_events"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "polymarket"."market_tags" ADD CONSTRAINT "market_tags_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "polymarket"."markets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "polymarket"."market_tags" ADD CONSTRAINT "market_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "polymarket"."tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "polymarket"."market_event_tags" ADD CONSTRAINT "market_event_tags_market_event_id_fkey" FOREIGN KEY ("market_event_id") REFERENCES "polymarket"."market_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "polymarket"."market_event_tags" ADD CONSTRAINT "market_event_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "polymarket"."tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;