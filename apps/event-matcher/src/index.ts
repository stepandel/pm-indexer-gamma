#!/usr/bin/env node

import { database, logger } from '@prediction-markets/shared';

interface EventMatch {
  polymarket_id: string;
  polymarket_title: string;
  kalshi_ticker: string;
  kalshi_title: string;
  sim_score: number;
}

interface MarketEntry {
  id: string;
  polymarket_id: string | null;
  kalshi_ticker: string | null;
  sim_score: number | null;
}

interface EventMatchResult {
  processed: number;
  matches: number;
  errors: number;
}

class EventMatcher {
  private db: typeof database;

  constructor() {
    this.db = database;
  }

  async getMatchingEvents(): Promise<EventMatch[]> {
    if (!this.db) {
      throw new Error('Database not available');
    }

    logger.info('Finding matching events (this may take up to a minute)...');

    try {
      const matchQuery = `
        WITH polymarkets AS (
          SELECT
            pe.id,
            pe.title,
            pd.event_time_utc
          FROM polymarket.market_events pe
          LEFT JOIN polymarket.event_date pd ON pe.id = pd.event_id
          WHERE pd.event_time_utc IS NOT NULL
        ),
        kalshis AS (
          SELECT
            ke.event_ticker,
            ke.title,
            kd.event_time_utc
          FROM kalshi.events ke
          LEFT JOIN kalshi.event_date kd ON ke.event_ticker = kd.event_id
          WHERE kd.event_time_utc IS NOT NULL
        )
        SELECT
          p.id as polymarket_id,
          p.title as polymarket_title,
          k.event_ticker as kalshi_ticker,
          k.title as kalshi_title,
          similarity(p.title, k.title) as sim_score
        FROM polymarkets p
        JOIN kalshis k ON p.title % k.title
          AND ABS(EXTRACT(EPOCH FROM (p.event_time_utc - k.event_time_utc))) <= 86400
        WHERE similarity(p.title, k.title) > 0.6
      `;

      const result = await this.db.query(matchQuery);
      const matches = result.rows as EventMatch[];

      logger.info(`Found ${matches.length} matching events`);
      logger.info(JSON.stringify(matches[0], null, 2));

      return matches;
    } catch (error) {
      logger.error('Failed to find matching events:', error);
      throw error;
    }
  }

  async upsertMatches(matches: EventMatch[]): Promise<EventMatchResult> {
    if (!this.db) {
      throw new Error('Database not available');
    }

    if (matches.length === 0) {
      logger.info('No matches to upsert');
      return { processed: 0, matches: 0, errors: 0 };
    }

    logger.info(`Upserting ${matches.length} matches to database...`);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const match of matches) {
        try {
          const upsertQuery = `
            INSERT INTO public.event_match_similarity (id, polymarket_id, kalshi_ticker, polymarket_title, kalshi_title, sim_score, created_at, updated_at)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (polymarket_id, kalshi_ticker)
            DO UPDATE SET
              polymarket_title = EXCLUDED.polymarket_title,
              kalshi_title = EXCLUDED.kalshi_title,
              sim_score = EXCLUDED.sim_score,
              updated_at = EXCLUDED.updated_at
          `;

          await this.db.query(upsertQuery, [
            match.polymarket_id,
            match.kalshi_ticker,
            match.polymarket_title,
            match.kalshi_title,
            match.sim_score
          ]);

          successCount++;
        } catch (error) {
          logger.error(`Failed to upsert match ${match.polymarket_id} <-> ${match.kalshi_ticker}:`, error);
          errorCount++;
        }
      }

      logger.info(`Upsert completed: ${successCount} successful, ${errorCount} errors`);

      return {
        processed: matches.length,
        matches: successCount,
        errors: errorCount
      };
    } catch (error) {
      logger.error('Upsert operation failed:', error);
      return {
        processed: 0,
        matches: 0,
        errors: matches.length
      };
    }
  }

  async processEventMatching(): Promise<EventMatchResult> {
    try {
      // Step 1: Get matching events
      const matches = await this.getMatchingEvents();

      // Step 2: Upsert them to the database
      const result = await this.upsertMatches(matches);

      return result;
    } catch (error) {
      logger.error('Event matching process failed:', error);
      return {
        processed: 0,
        matches: 0,
        errors: 1
      };
    }
  }

  async populateMarketsTable(): Promise<EventMatchResult> {
    if (!this.db) {
      throw new Error('Database not available');
    }

    logger.info('Populating markets table with unified market data...');

    try {
      // First, clear the existing markets table
      await this.db.query('DELETE FROM public.markets');

      const populateQuery = `
        INSERT INTO public.markets (id, polymarket_id, kalshi_ticker, sim_score, created_at, updated_at)
        WITH scored AS (
          SELECT
            *,
            ROW_NUMBER() OVER (PARTITION BY polymarket_id ORDER BY sim_score DESC) as pm_rank,
            ROW_NUMBER() OVER (PARTITION BY kalshi_ticker ORDER BY sim_score DESC) as k_rank
          FROM event_match_similarity
        ),
        filtered AS (
          SELECT *
          FROM scored
          WHERE pm_rank = 1 AND k_rank = 1
        ),
        matched AS (
          SELECT
            id::uuid,
            polymarket_id,
            kalshi_ticker,
            sim_score
          FROM filtered
        )
        SELECT
          id,
          polymarket_id,
          kalshi_ticker,
          sim_score,
          NOW(),
          NOW()
        FROM matched

        UNION ALL

        SELECT
          uuid_generate_v4() as id,
          pm.id as polymarket_id,
          NULL as kalshi_ticker,
          NULL as sim_score,
          NOW(),
          NOW()
        FROM polymarket.market_events pm
        WHERE NOT EXISTS (
          SELECT 1 FROM matched m WHERE m.polymarket_id = pm.id
        )

        UNION ALL

        SELECT
          uuid_generate_v4() as id,
          NULL as polymarket_id,
          k.event_ticker as kalshi_ticker,
          NULL as sim_score,
          NOW(),
          NOW()
        FROM kalshi.events k
        WHERE NOT EXISTS (
          SELECT 1 FROM matched m WHERE m.kalshi_ticker = k.event_ticker
        )
      `;

      const result = await this.db.query(populateQuery);
      const rowCount = result.rowCount || 0;

      logger.info(`Markets table populated with ${rowCount} entries`);

      return {
        processed: rowCount,
        matches: rowCount,
        errors: 0
      };
    } catch (error) {
      logger.error('Failed to populate markets table:', error);
      return {
        processed: 0,
        matches: 0,
        errors: 1
      };
    }
  }

  async getMarketsStats() {
    if (!this.db) {
      throw new Error('Database not available');
    }

    try {
      const statsQuery = `
        SELECT
          COUNT(*) as total_markets,
          COUNT(CASE WHEN polymarket_id IS NOT NULL AND kalshi_ticker IS NOT NULL THEN 1 END) as matched_markets,
          COUNT(CASE WHEN polymarket_id IS NOT NULL AND kalshi_ticker IS NULL THEN 1 END) as polymarket_only,
          COUNT(CASE WHEN polymarket_id IS NULL AND kalshi_ticker IS NOT NULL THEN 1 END) as kalshi_only,
          AVG(sim_score) as avg_similarity
        FROM public.markets
      `;

      const result = await this.db.query(statsQuery);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get markets stats:', error);
      return null;
    }
  }

  async getMatchingStats() {
    if (!this.db) {
      throw new Error('Database not available');
    }

    try {
      const statsQuery = `
        SELECT
          COUNT(*) as total_matches,
          AVG(sim_score) as avg_similarity,
          MIN(sim_score) as min_similarity,
          MAX(sim_score) as max_similarity,
          COUNT(DISTINCT polymarket_id) as unique_polymarket_events,
          COUNT(DISTINCT kalshi_ticker) as unique_kalshi_events
        FROM public.event_match_similarity
      `;

      const result = await this.db.query(statsQuery);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get matching stats:', error);
      return null;
    }
  }

}

const main = async () => {
  logger.info('🔍 Event Matcher starting');

  const matcher = new EventMatcher();

  try {
    // Test database connection
    if (!database || !(await database.testConnection())) {
      logger.error('Database connection failed');
      process.exit(1);
    }

    // Get stats before processing
    const statsBefore = await matcher.getMatchingStats();
    if (statsBefore) {
      logger.info('📊 Stats before processing:');
      logger.info(`   Total matches: ${statsBefore.total_matches}`);
      logger.info(`   Average similarity: ${parseFloat(statsBefore.avg_similarity || '0').toFixed(3)}`);
      logger.info(`   Unique Polymarket events: ${statsBefore.unique_polymarket_events}`);
      logger.info(`   Unique Kalshi events: ${statsBefore.unique_kalshi_events}`);
    }

    // Process all event matching
    logger.info('🚀 Processing event matching');
    const results = await matcher.processEventMatching();
    logger.info('📋 Event Matching Results:');
    logger.info(`   Matches found/updated: ${results.matches}`);
    logger.info(`   Errors: ${results.errors}`);

    // Get stats after processing
    const statsAfter = await matcher.getMatchingStats();
    if (statsAfter) {
      logger.info('📊 Event Matching Stats:');
      logger.info(`   Total matches: ${statsAfter.total_matches}`);
      logger.info(`   Average similarity: ${parseFloat(statsAfter.avg_similarity || '0').toFixed(3)}`);
      logger.info(`   Unique Polymarket events: ${statsAfter.unique_polymarket_events}`);
      logger.info(`   Unique Kalshi events: ${statsAfter.unique_kalshi_events}`);
    }

    // Populate markets table
    logger.info('🏪 Populating markets table');
    const marketsResult = await matcher.populateMarketsTable();
    logger.info('📋 Markets Population Results:');
    logger.info(`   Total markets created: ${marketsResult.matches}`);
    logger.info(`   Errors: ${marketsResult.errors}`);

    // Get markets stats
    const marketsStats = await matcher.getMarketsStats();
    if (marketsStats) {
      logger.info('📊 Markets Table Stats:');
      logger.info(`   Total markets: ${marketsStats.total_markets}`);
      logger.info(`   Matched markets: ${marketsStats.matched_markets}`);
      logger.info(`   Polymarket only: ${marketsStats.polymarket_only}`);
      logger.info(`   Kalshi only: ${marketsStats.kalshi_only}`);
      logger.info(`   Average similarity: ${parseFloat(marketsStats.avg_similarity || '0').toFixed(3)}`);
    }

    logger.info('✓ Event matching completed successfully');
    process.exit(0);

  } catch (error) {
    logger.error('✗ Event matching failed:', error);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});