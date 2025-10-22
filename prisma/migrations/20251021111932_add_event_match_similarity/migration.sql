-- CreateTable
CREATE TABLE "public"."event_match_similarity" (
    "id" TEXT NOT NULL,
    "polymarket_id" TEXT NOT NULL,
    "kalshi_ticker" TEXT NOT NULL,
    "sim_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_match_similarity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unique_event_match" ON "public"."event_match_similarity"("polymarket_id", "kalshi_ticker");

-- CreateIndex
CREATE INDEX "idx_event_match_similarity_polymarket_id" ON "public"."event_match_similarity"("polymarket_id");

-- CreateIndex
CREATE INDEX "idx_event_match_similarity_kalshi_ticker" ON "public"."event_match_similarity"("kalshi_ticker");

-- CreateIndex
CREATE INDEX "idx_event_match_similarity_score" ON "public"."event_match_similarity"("sim_score");

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set default UUID for id column
ALTER TABLE "public"."event_match_similarity" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();