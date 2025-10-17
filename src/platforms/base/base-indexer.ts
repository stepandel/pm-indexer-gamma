import { logger } from '../../lib/logger';
import type { IndexerResult, PlatformClient, PlatformDatabaseOperations } from './platform-interface';

export abstract class BaseIndexer {
  constructor(
    protected client: PlatformClient,
    protected dbOps: PlatformDatabaseOperations,
    protected platformName: string
  ) {}

  async testConnection(): Promise<boolean> {
    try {
      logger.info(`Testing connection to ${this.platformName} API`);
      const isConnected = await this.client.testConnection();

      if (isConnected) {
        logger.info(`${this.platformName} connection test successful`);
      } else {
        logger.warn(`${this.platformName} connection test failed`);
      }

      return isConnected;
    } catch (error) {
      logger.error(`${this.platformName} connection test failed`, error);
      return false;
    }
  }

  async run(): Promise<IndexerResult> {
    const startTime = Date.now();
    logger.info(`Starting ${this.platformName} indexer run`);

    try {
      const result = await this.performIndexing();

      const duration = Date.now() - startTime;
      logger.info(`${this.platformName} indexer run completed successfully in ${duration}ms`, result);

      return {
        ...result,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error(`${this.platformName} indexer run failed after ${duration}ms`, { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      };
    }
  }

  protected abstract performIndexing(): Promise<Partial<IndexerResult>>;
}