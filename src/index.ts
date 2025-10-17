#!/usr/bin/env bun

import { platformRegistry, registerPlatforms } from './platforms/platform-registry';
import { selectedPlatform, selectedPlatformConfig } from './config/config';
import { logger } from './lib/logger';

const main = async () => {
  logger.info(`Multi-platform Indexer starting for platform: ${selectedPlatform}`);

  // Register all platforms
  await registerPlatforms();

  // Check if platform is enabled
  if (!selectedPlatformConfig.enabled) {
    logger.error(`Platform ${selectedPlatform} is not enabled`);
    process.exit(1);
  }

  // Get the platform instance
  const platform = await platformRegistry.get(selectedPlatform);
  if (!platform) {
    logger.error(`Platform ${selectedPlatform} not found in registry`);
    process.exit(1);
  }

  const indexer = platform.getIndexer();

  // Test connection first
  const isConnected = await indexer.testConnection();
  if (!isConnected) {
    logger.error(`Failed to connect to ${selectedPlatform} API`);
    process.exit(1);
  }

  // Run the indexer
  const result = await indexer.run();

  if (result.success) {
    logger.info(`${selectedPlatform} indexer run completed successfully`);
    process.exit(0);
  } else {
    logger.error(`${selectedPlatform} indexer run failed`, { error: result.error });
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