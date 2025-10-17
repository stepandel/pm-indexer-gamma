import { BaseIndexer } from '../base/base-indexer';
import { logger } from '../../lib/logger';
import type { PlatformClient, PlatformDatabaseOperations, IndexerResult } from '../base/platform-interface';
import type { MarketEvent } from './types';

export class PolymarketIndexer extends BaseIndexer {
  constructor(client: PlatformClient, dbOps: PlatformDatabaseOperations) {
    super(client, dbOps, 'Polymarket');
  }

  protected async performIndexing(): Promise<Partial<IndexerResult>> {
    logger.debug('Fetching active Polymarket events');

    let totalEvents = 0;
    let totalMarkets = 0;
    let totalTags = 0;
    let firstEventId = '';
    let lastEventId = '';

    // Process events one by one (simplified approach)
    const activeEventsGenerator = await this.client.getActiveEvents();
    for await (const eventBatch of activeEventsGenerator) {
      if (eventBatch.length === 0) continue;

      if (totalEvents === 0) firstEventId = eventBatch[0].id;
      lastEventId = eventBatch[eventBatch.length - 1].id;

      // Process each event individually
      for (const event of eventBatch) {
        totalEvents++;

        const result = await this.dbOps.saveEventWithMarkets(event as MarketEvent);
        if (result.markets) {
          totalMarkets += result.markets.length;
        }
        if (result.tags) {
          totalTags += result.tags.length;
        }
      }
      logger.debug(`Processed Polymarket batch: ${eventBatch.length} events`);
    }

    if (totalEvents > 0) {
      logger.info(`Found and saved ${totalEvents} Polymarket events with ${totalMarkets} markets and ${totalTags} tags`);
      logger.info(`First event ID: ${firstEventId}`);
      logger.info(`Last event ID: ${lastEventId}`);
    }

    return {
      markets: [],
      events: [], // Not storing events in memory anymore
    };
  }
}