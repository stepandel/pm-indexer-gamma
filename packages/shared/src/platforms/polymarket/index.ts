import { BasePlatform } from '../base/platform-interface.js';
import type { PlatformConfig, PlatformIndexer } from '../base/platform-interface.js';
import { PolymarketClient } from './client.js';
import { PolymarketDatabaseOperations } from './operations.js';
import { PolymarketIndexer } from './indexer.js';
import { config } from '../../config/config.js';
import { database } from '../../lib/database.js';

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