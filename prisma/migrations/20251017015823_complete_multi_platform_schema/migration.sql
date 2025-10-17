-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "kalshi";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "polymarket";

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "polymarket"."tags" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polymarket"."market_tags" (
    "market_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_tags_pkey" PRIMARY KEY ("market_id","tag_id")
);

-- CreateTable
CREATE TABLE "polymarket"."market_event_tags" (
    "market_event_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_event_tags_pkey" PRIMARY KEY ("market_event_id","tag_id")
);

-- CreateTable
CREATE TABLE "kalshi"."events" (
    "event_ticker" TEXT NOT NULL,
    "series_ticker" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sub_title" TEXT,
    "category" TEXT,
    "collateral_return_type" TEXT,
    "mutually_exclusive" BOOLEAN DEFAULT false,
    "price_level_structure" TEXT,
    "available_on_brokers" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("event_ticker")
);

-- CreateTable
CREATE TABLE "kalshi"."markets" (
    "ticker" TEXT NOT NULL,
    "event_ticker" TEXT NOT NULL,
    "market_type" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "yes_sub_title" TEXT,
    "no_sub_title" TEXT,
    "open_time" TIMESTAMPTZ(6),
    "close_time" TIMESTAMPTZ(6),
    "expected_expiration_time" TIMESTAMPTZ(6),
    "expiration_time" TIMESTAMPTZ(6),
    "latest_expiration_time" TIMESTAMPTZ(6),
    "settlement_timer_seconds" INTEGER,
    "status" TEXT,
    "response_price_units" TEXT,
    "can_close_early" BOOLEAN DEFAULT false,
    "rules_primary" TEXT,
    "notional_value" INTEGER,
    "notional_value_dollars" TEXT,
    "yes_bid" DOUBLE PRECISION,
    "yes_ask" DOUBLE PRECISION,
    "no_bid" DOUBLE PRECISION,
    "no_ask" DOUBLE PRECISION,
    "last_price" DOUBLE PRECISION,
    "previous_price" DOUBLE PRECISION,
    "previous_yes_bid" DOUBLE PRECISION,
    "previous_yes_ask" DOUBLE PRECISION,
    "previous_no_bid" DOUBLE PRECISION,
    "previous_no_ask" DOUBLE PRECISION,
    "volume" INTEGER DEFAULT 0,
    "liquidity" INTEGER DEFAULT 0,
    "liquidity_dollars" TEXT,
    "open_interest" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("ticker")
);

-- CreateIndex
CREATE INDEX "idx_polymarket_markets_market_event_id" ON "polymarket"."markets"("market_event_id");

-- CreateIndex
CREATE INDEX "idx_polymarket_markets_active" ON "polymarket"."markets"("active");

-- CreateIndex
CREATE INDEX "idx_polymarket_markets_closed" ON "polymarket"."markets"("closed");

-- CreateIndex
CREATE INDEX "idx_polymarket_markets_condition_id" ON "polymarket"."markets"("conditionId");

-- CreateIndex
CREATE INDEX "idx_polymarket_markets_slug" ON "polymarket"."markets"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "market_events_slug_key" ON "polymarket"."market_events"("slug");

-- CreateIndex
CREATE INDEX "idx_polymarket_market_events_active" ON "polymarket"."market_events"("active");

-- CreateIndex
CREATE INDEX "idx_polymarket_market_events_closed" ON "polymarket"."market_events"("closed");

-- CreateIndex
CREATE INDEX "idx_polymarket_market_events_featured" ON "polymarket"."market_events"("featured");

-- CreateIndex
CREATE INDEX "idx_polymarket_market_events_ticker" ON "polymarket"."market_events"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "polymarket"."tags"("slug");

-- CreateIndex
CREATE INDEX "idx_polymarket_market_tags_market_id" ON "polymarket"."market_tags"("market_id");

-- CreateIndex
CREATE INDEX "idx_polymarket_market_tags_tag_id" ON "polymarket"."market_tags"("tag_id");

-- CreateIndex
CREATE INDEX "idx_polymarket_market_event_tags_market_event_id" ON "polymarket"."market_event_tags"("market_event_id");

-- CreateIndex
CREATE INDEX "idx_polymarket_market_event_tags_tag_id" ON "polymarket"."market_event_tags"("tag_id");

-- CreateIndex
CREATE INDEX "idx_kalshi_events_ticker" ON "kalshi"."events"("event_ticker");

-- CreateIndex
CREATE INDEX "idx_kalshi_events_series_ticker" ON "kalshi"."events"("series_ticker");

-- CreateIndex
CREATE INDEX "idx_kalshi_events_category" ON "kalshi"."events"("category");

-- CreateIndex
CREATE INDEX "idx_kalshi_markets_ticker" ON "kalshi"."markets"("ticker");

-- CreateIndex
CREATE INDEX "idx_kalshi_markets_event_ticker" ON "kalshi"."markets"("event_ticker");

-- CreateIndex
CREATE INDEX "idx_kalshi_markets_status" ON "kalshi"."markets"("status");

-- CreateIndex
CREATE INDEX "idx_kalshi_markets_type" ON "kalshi"."markets"("market_type");

-- AddForeignKey
ALTER TABLE "polymarket"."markets" ADD CONSTRAINT "markets_market_event_id_fkey" FOREIGN KEY ("market_event_id") REFERENCES "polymarket"."market_events"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "polymarket"."market_tags" ADD CONSTRAINT "market_tags_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "polymarket"."markets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "polymarket"."market_tags" ADD CONSTRAINT "market_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "polymarket"."tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "polymarket"."market_event_tags" ADD CONSTRAINT "market_event_tags_market_event_id_fkey" FOREIGN KEY ("market_event_id") REFERENCES "polymarket"."market_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "polymarket"."market_event_tags" ADD CONSTRAINT "market_event_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "polymarket"."tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kalshi"."markets" ADD CONSTRAINT "markets_event_ticker_fkey" FOREIGN KEY ("event_ticker") REFERENCES "kalshi"."events"("event_ticker") ON DELETE CASCADE ON UPDATE CASCADE;
