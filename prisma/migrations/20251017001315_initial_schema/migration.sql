-- CreateTable
CREATE TABLE "public"."markets" (
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
CREATE TABLE "public"."market_events" (
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
CREATE TABLE "public"."tags" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."market_tags" (
    "market_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_tags_pkey" PRIMARY KEY ("market_id","tag_id")
);

-- CreateTable
CREATE TABLE "public"."market_event_tags" (
    "market_event_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_event_tags_pkey" PRIMARY KEY ("market_event_id","tag_id")
);

-- CreateIndex
CREATE INDEX "idx_markets_market_event_id" ON "public"."markets"("market_event_id");

-- CreateIndex
CREATE INDEX "idx_markets_active" ON "public"."markets"("active");

-- CreateIndex
CREATE INDEX "idx_markets_closed" ON "public"."markets"("closed");

-- CreateIndex
CREATE INDEX "idx_markets_condition_id" ON "public"."markets"("conditionId");

-- CreateIndex
CREATE INDEX "idx_markets_slug" ON "public"."markets"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "market_events_slug_key" ON "public"."market_events"("slug");

-- CreateIndex
CREATE INDEX "idx_market_events_active" ON "public"."market_events"("active");

-- CreateIndex
CREATE INDEX "idx_market_events_closed" ON "public"."market_events"("closed");

-- CreateIndex
CREATE INDEX "idx_market_events_featured" ON "public"."market_events"("featured");

-- CreateIndex
CREATE INDEX "idx_market_events_ticker" ON "public"."market_events"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "public"."tags"("slug");

-- CreateIndex
CREATE INDEX "idx_market_tags_market_id" ON "public"."market_tags"("market_id");

-- CreateIndex
CREATE INDEX "idx_market_tags_tag_id" ON "public"."market_tags"("tag_id");

-- CreateIndex
CREATE INDEX "idx_market_event_tags_market_event_id" ON "public"."market_event_tags"("market_event_id");

-- CreateIndex
CREATE INDEX "idx_market_event_tags_tag_id" ON "public"."market_event_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "public"."markets" ADD CONSTRAINT "markets_market_event_id_fkey" FOREIGN KEY ("market_event_id") REFERENCES "public"."market_events"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."market_tags" ADD CONSTRAINT "market_tags_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."market_tags" ADD CONSTRAINT "market_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."market_event_tags" ADD CONSTRAINT "market_event_tags_market_event_id_fkey" FOREIGN KEY ("market_event_id") REFERENCES "public"."market_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."market_event_tags" ADD CONSTRAINT "market_event_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
