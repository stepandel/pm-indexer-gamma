import { BasePlatform } from '../base/platform-interface';
import type { PlatformConfig, PlatformIndexer } from '../base/platform-interface';
import { KalshiClient } from './client';
import { KalshiDatabaseOperations } from './operations';
import { KalshiIndexer } from './indexer';
import { config } from '../../config/config';

export class KalshiPlatform extends BasePlatform {
  private indexer: PlatformIndexer;

  constructor() {
    const platformConfig: PlatformConfig = {
      apiUrl: config.platforms.kalshi.apiUrl,
      schema: config.platforms.kalshi.schema,
      enabled: config.platforms.kalshi.enabled
    };

    const client = new KalshiClient();
    const dbOps = new KalshiDatabaseOperations();

    super(platformConfig, client, dbOps);

    this.indexer = new KalshiIndexer(client, dbOps);
  }

  getName(): string {
    return 'kalshi';
  }

  getIndexer(): PlatformIndexer {
    return this.indexer;
  }
}