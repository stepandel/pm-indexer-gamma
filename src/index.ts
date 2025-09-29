#!/usr/bin/env bun

import { createPolymarketIndexer } from './lib/indexer';
import { logger } from './lib/logger';

const main = async () => {
  logger.info('Polymarket Indexer starting...');

  const indexer = createPolymarketIndexer();

  // Test connection first
  const isConnected = await indexer.testConnection();
  if (!isConnected) {
    logger.error('Failed to connect to Polymarket API');
    process.exit(1);
  }

  // Run the indexer
  const result = await indexer.run();

  if (result.success) {
    logger.info('Indexer run completed successfully');
    process.exit(0);
  } else {
    logger.error('Indexer run failed', { error: result.error });
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  logger.error('Fatal error', error);
  process.exit(1);
});