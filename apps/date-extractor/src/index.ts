#!/usr/bin/env node

import { selectedPlatform, logger } from '@prediction-markets/shared';
import { PolymarketProcessor } from './processors/polymarket.js';
import { KalshiProcessor } from './processors/kalshi.js';
import { BaseProcessor } from './processors/base.js';

/**
 * Main date extraction application
 * Extracts resolution dates from market events based on platform selection
 */
const main = async () => {
  logger.info(`🔍 Date Extractor starting for platform: ${selectedPlatform}`);

  let processor: BaseProcessor;

  // Initialize platform-specific processor
  switch (selectedPlatform) {
    case 'polymarket':
      processor = new PolymarketProcessor();
      break;
    case 'kalshi':
      processor = new KalshiProcessor();
      break;
    default:
      logger.error(`Invalid platform: ${selectedPlatform}. Available platforms: polymarket, kalshi`);
      process.exit(1);
  }

  try {
    // Parse command line arguments for mode selection
    const args = process.argv.slice(2);
    const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'batch';
    const offset = parseInt(args.find(arg => arg.startsWith('--offset='))?.split('=')[1] || '0');
    const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '1000');

    // Get stats before processing
    const statsBefore = await processor.getDateExtractionStats();
    processor['printDateStats']("Stats before processing", statsBefore);

    switch (mode) {
      case 'test':
        // Test on sample events
        await processor.processTestMode();
        break;

      case 'batch':
        // Process a single batch
        logger.info(`\n🚀 Processing batch of ${limit} events starting at offset ${offset}`);
        const results = await processor.processEventsForDates(offset, limit);
        logger.info(`\n📋 Batch Results:`);
        logger.info(`   Processed: ${results.processed} events`);
        logger.info(`   Dates found: ${results.datesFound}`);
        logger.info(`   Events updated: ${results.eventsUpdated}`);
        logger.info(`   Errors: ${results.errors}`);
        break;

      case 'full':
        // Process all events in batches
        await processor.processFullMode(limit);
        break;

      default:
        logger.error(`Invalid mode: ${mode}. Available modes: test, batch, full`);
        process.exit(1);
    }

    // Get stats after processing
    const statsAfter = await processor.getDateExtractionStats();
    processor['printDateStats']("Stats after processing", statsAfter);

    logger.info(`\n✓ ${selectedPlatform} date extraction completed successfully`);
    process.exit(0);

  } catch (error) {
    logger.error(`✗ ${selectedPlatform} date extraction failed:`, error);
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