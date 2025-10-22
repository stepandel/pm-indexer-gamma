-- CreateTable
CREATE TABLE "public"."markets" (
    "id" TEXT NOT NULL,
    "polymarket_id" TEXT,
    "kalshi_ticker" TEXT,
    "sim_score" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_markets_polymarket_id" ON "public"."markets"("polymarket_id");

-- CreateIndex
CREATE INDEX "idx_markets_kalshi_ticker" ON "public"."markets"("kalshi_ticker");

-- CreateIndex
CREATE INDEX "idx_markets_sim_score" ON "public"."markets"("sim_score");

-- Set default UUID for id column
ALTER TABLE "public"."markets" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();