-- CreateTable
CREATE TABLE "polymarket"."event_date" (
    "event_id" TEXT NOT NULL,
    "event_time_utc" TIMESTAMPTZ(6) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "extracted_text" TEXT,
    "pattern_type" TEXT,
    "timezone_abbr" TEXT,
    "time_range" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_date_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "kalshi"."event_date" (
    "event_id" TEXT NOT NULL,
    "event_time_utc" TIMESTAMPTZ(6) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "extracted_text" TEXT,
    "pattern_type" TEXT,
    "timezone_abbr" TEXT,
    "time_range" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_date_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE INDEX "idx_polymarket_event_date_confidence" ON "polymarket"."event_date"("confidence");

-- CreateIndex
CREATE INDEX "idx_polymarket_event_date_time" ON "polymarket"."event_date"("event_time_utc");

-- CreateIndex
CREATE INDEX "idx_kalshi_event_date_confidence" ON "kalshi"."event_date"("confidence");

-- CreateIndex
CREATE INDEX "idx_kalshi_event_date_time" ON "kalshi"."event_date"("event_time_utc");

-- AddForeignKey
ALTER TABLE "polymarket"."event_date" ADD CONSTRAINT "event_date_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "polymarket"."market_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kalshi"."event_date" ADD CONSTRAINT "event_date_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "kalshi"."events"("event_ticker") ON DELETE CASCADE ON UPDATE CASCADE;
