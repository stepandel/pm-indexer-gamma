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

  async processEventMatching(offset: number = 0, limit: number = 1000): Promise<EventMatchResult> {
    if (!this.db) {
      throw new Error('Database not available');
    }

    logger.info(`Processing event matching with offset ${offset}, limit ${limit}`);

    try {
      const matchQuery = `
        INSERT INTO public.event_match_similarity (polymarket_id, kalshi_ticker, sim_score, created_at, updated_at)
        SELECT
          p.id,
          ks.event_ticker,
          ks.sim_score,
          NOW(),
          NOW()
        FROM polymarket.market_events p
        LEFT JOIN LATERAL (
          SELECT
            k.event_ticker,
            similarity(p.title, k.title) as sim_score
          FROM kalshi.events k
          WHERE difference(lower(unaccent(p.title)), lower(unaccent(k.title))) >= 4
            AND similarity(p.title, k.title) > 0.6
        ) ks ON true
        WHERE ks.event_ticker IS NOT NULL
        OFFSET $1 LIMIT $2
        ON CONFLICT (polymarket_id, kalshi_ticker)
        DO UPDATE SET
          sim_score = EXCLUDED.sim_score,
          updated_at = EXCLUDED.updated_at
      `;

      const result = await this.db.query(matchQuery, [offset, limit]);
      const matchCount = result.rowCount || 0;

      logger.info(`Event matching completed: ${matchCount} matches found/updated`);

      return {
        processed: limit,
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

  async processFullMatching(batchSize: number = 1000): Promise<void> {
    logger.info('Starting full event matching process');

    let offset = 0;
    let totalMatches = 0;
    let totalErrors = 0;

    while (true) {
      const result = await this.processEventMatching(offset, batchSize);

      totalMatches += result.matches;
      totalErrors += result.errors;

      if (result.matches === 0) {
        logger.info('No more matches found, stopping');
        break;
      }

      offset += batchSize;
      logger.info(`Progress: ${offset} events processed, ${totalMatches} total matches`);
    }

    logger.info(`Full matching completed: ${totalMatches} total matches, ${totalErrors} errors`);
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

    // Parse command line arguments
    const args = process.argv.slice(2);
    const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'batch';
    const offset = parseInt(args.find(arg => arg.startsWith('--offset='))?.split('=')[1] || '0');
    const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '1000');

    // Get stats before processing
    const statsBefore = await matcher.getMatchingStats();
    if (statsBefore) {
      logger.info('📊 Stats before processing:');
      logger.info(`   Total matches: ${statsBefore.total_matches}`);
      logger.info(`   Average similarity: ${parseFloat(statsBefore.avg_similarity || '0').toFixed(3)}`);
      logger.info(`   Unique Polymarket events: ${statsBefore.unique_polymarket_events}`);
      logger.info(`   Unique Kalshi events: ${statsBefore.unique_kalshi_events}`);
    }

    switch (mode) {
      case 'batch':
        logger.info(`🚀 Processing batch of ${limit} events starting at offset ${offset}`);
        const results = await matcher.processEventMatching(offset, limit);
        logger.info('📋 Batch Results:');
        logger.info(`   Processed: ${results.processed} events`);
        logger.info(`   Matches found: ${results.matches}`);
        logger.info(`   Errors: ${results.errors}`);
        break;

      case 'full':
        await matcher.processFullMatching(limit);
        break;

      default:
        logger.error(`Invalid mode: ${mode}. Available modes: batch, full`);
        process.exit(1);
    }

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