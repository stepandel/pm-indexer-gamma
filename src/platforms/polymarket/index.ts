import { BasePlatform } from '../base/platform-interface';
import type { PlatformConfig, PlatformIndexer } from '../base/platform-interface';
import { PolymarketClient } from './client';
import { PolymarketDatabaseOperations } from './operations';
import { PolymarketIndexer } from './indexer';
import { config } from '../../config/config';
import { database } from '../../lib/database';

export class PolymarketPlatform extends BasePlatform {
  private indexer: PlatformIndexer;

  constructor() {
    const platformConfig: PlatformConfig = {
      apiUrl: config.platforms.polymarket.apiUrl,
      schema: config.platforms.polymarket.schema,
    };

    const client = new PolymarketClient();
    const dbOps = new PolymarketDatabaseOperations();

    super(platformConfig, client, dbOps);

    this.indexer = new PolymarketIndexer(client, dbOps);
  }

  getName(): string {
    return 'polymarket';
  }

  getIndexer(): PlatformIndexer {
    return this.indexer;
  }

  async testDatabaseConnection(): Promise<boolean> {
    if (database) {
      return database.testConnection();
    }
    return false;
  }
}