#!/usr/bin/env node

import { database, logger } from '@prediction-markets/shared';

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

  async processEventMatching(): Promise<EventMatchResult> {
    if (!this.db) {
      throw new Error('Database not available');
    }

    logger.info('Processing event matching (this may take up to a minute)...');

    try {
      const matchQuery = `
        INSERT INTO public.event_match_similarity (polymarket_id, kalshi_ticker, polymarket_title, kalshi_title, sim_score, created_at, updated_at)
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
          p.id,
          k.event_ticker,
          p.title,
          k.title,
          similarity(p.title, k.title),
          NOW(),
          NOW()
        FROM polymarkets p
        JOIN kalshis k ON p.title % k.title
          AND ABS(EXTRACT(EPOCH FROM (p.event_time_utc - k.event_time_utc))) <= 86400
        WHERE similarity(p.title, k.title) > 0.6
        ON CONFLICT (polymarket_id, kalshi_ticker)
        DO UPDATE SET
          polymarket_title = EXCLUDED.polymarket_title,
          kalshi_title = EXCLUDED.kalshi_title,
          sim_score = EXCLUDED.sim_score,
          updated_at = EXCLUDED.updated_at
      `;

      const result = await this.db.query(matchQuery);
      const matchCount = result.rowCount || 0;

      logger.info(`Event matching completed: ${matchCount} matches found/updated`);

      return {
        processed: matchCount,
        matches: matchCount,
        errors: 0
      };
    } catch (error) {
      logger.error('Event matching failed:', error);
      return {
        processed: 0,
        matches: 0,
        errors: 1
      };
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
    logger.info('📋 Results:');
    logger.info(`   Matches found/updated: ${results.matches}`);
    logger.info(`   Errors: ${results.errors}`);

    // Get stats after processing
    const statsAfter = await matcher.getMatchingStats();
    if (statsAfter) {
      logger.info('📊 Stats after processing:');
      logger.info(`   Total matches: ${statsAfter.total_matches}`);
      logger.info(`   Average similarity: ${parseFloat(statsAfter.avg_similarity || '0').toFixed(3)}`);
      logger.info(`   Unique Polymarket events: ${statsAfter.unique_polymarket_events}`);
      logger.info(`   Unique Kalshi events: ${statsAfter.unique_kalshi_events}`);
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