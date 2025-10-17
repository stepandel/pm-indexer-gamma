import { BaseIndexer } from '../base/base-indexer';
import { logger } from '../../lib/logger';
import type { PlatformClient, PlatformDatabaseOperations, IndexerResult } from '../base/platform-interface';
import type { KalshiEvent } from './types';

export class KalshiIndexer extends BaseIndexer {
  constructor(client: PlatformClient, dbOps: PlatformDatabaseOperations) {
    super(client, dbOps, 'Kalshi');
  }

  protected async performIndexing(): Promise<Partial<IndexerResult>> {
    logger.debug('Fetching active Kalshi events');

    let totalEvents = 0;
    let totalMarkets = 0;
    let firstEventTicker = '';
    let lastEventTicker = '';

    // Process events with their nested markets
    const activeEventsGenerator = await this.client.getActiveEvents();
    for await (const eventBatch of activeEventsGenerator) {
      if (eventBatch.length === 0) continue;

      if (totalEvents === 0) firstEventTicker = eventBatch[0].event_ticker;
      lastEventTicker = eventBatch[eventBatch.length - 1].event_ticker;

      // Process each event individually
      for (const event of eventBatch) {
        totalEvents++;

        const result = await this.dbOps.saveEventWithMarkets(event as KalshiEvent);
        if (result.markets) {
          totalMarkets += result.markets.length;
        }
      }
      logger.debug(`Processed Kalshi batch: ${eventBatch.length} events`);
    }

    if (totalEvents > 0) {
      logger.info(`Found and saved ${totalEvents} Kalshi events with ${totalMarkets} markets`);
      logger.info(`First event ticker: ${firstEventTicker}`);
      logger.info(`Last event ticker: ${lastEventTicker}`);
    }

    return {
      markets: [],
      events: [], // Not storing events in memory anymore
    };
  }
}