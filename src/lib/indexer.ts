import { createPolymarketClient } from './polymarket-client';
import { logger } from './logger';
import { database } from './database';
import { saveEventWithMarkets } from './database-operations';
import type { IndexerResult } from '../types/market';

interface IndexerState {
  lastRunTimestamp: Date;
}

const createInitialState = (): IndexerState => ({
  lastRunTimestamp: new Date(Date.now() - 5 * 60 * 1000)
});

const fetchActiveMarkets = async (client: ReturnType<typeof createPolymarketClient>, state: IndexerState) => {
  logger.debug('Fetching active markets');

  try {
    const marketInfo = await client.getActiveMarkets();

    if (marketInfo.totalCount > 0) {
      logger.info(`Found ${marketInfo.totalCount} recently updated markets`);
      logger.info(`First recent market ID: ${marketInfo.firstMarketId}`);
      logger.info(`Last recent market ID: ${marketInfo.lastMarketId}`);
    }

    return marketInfo;
  } catch (error) {
    logger.error('Failed to fetch active markets', error);
    throw error;
  }
};

const fetchActiveEvents = async (client: ReturnType<typeof createPolymarketClient>, state: IndexerState) => {
  logger.debug('Fetching active events');

  try {
    let totalEvents = 0;
    let totalMarkets = 0;
    let totalTags = 0;
    let firstEventId = '';
    let lastEventId = '';

    // Process events one by one (simplified approach)
    for await (const eventBatch of client.getActiveEvents()) {
      if (eventBatch.length === 0) continue;

      if (totalEvents === 0) firstEventId = eventBatch[0].id;
      lastEventId = eventBatch[eventBatch.length - 1].id;

      // Process each event individually
      for (const event of eventBatch) {
        totalEvents++;

        const result = await saveEventWithMarkets(event);
        if (result.markets) {
          totalMarkets += result.markets.length;
        }
        if (result.tags) {
          totalTags += result.tags.length;
        }
      }
      logger.debug(`Processed batch: ${eventBatch.length} events`);
    }

    if (totalEvents > 0) {
      logger.info(`Found and saved ${totalEvents} events with ${totalMarkets} markets and ${totalTags} tags`);
      logger.info(`First event ID: ${firstEventId}`);
      logger.info(`Last event ID: ${lastEventId}`);
    }

    return { totalCount: totalEvents, firstEventId, lastEventId };
  } catch (error) {
    logger.error('Failed to fetch active events', error);
    throw error;
  }
};

const runIndexer = async (client: ReturnType<typeof createPolymarketClient>, state: IndexerState): Promise<IndexerResult> => {
  const startTime = Date.now();
  logger.info('Starting Polymarket indexer run');

  try {
    const eventInfo = await fetchActiveEvents(client, state);

    const duration = Date.now() - startTime;
    logger.info(`Indexer run completed successfully in ${duration}ms`, {
      eventsIndexed: eventInfo.totalCount,
    });

    return {
      markets: [],
      events: [], // Not storing events in memory anymore
      timestamp: Date.now(),
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Indexer run failed', { error: errorMessage });

    return {
      markets: [],
      events: [],
      timestamp: Date.now(),
      success: false,
      error: errorMessage,
    };
  }
};

const testConnection = async (client: ReturnType<typeof createPolymarketClient>): Promise<boolean> => {
  try {
    logger.info('Testing connection to Polymarket API');
    const events = await client.getEvents({ limit: 1 });

    if (events && events.length > 0) {
      logger.info('Connection test successful');
    } else {
      logger.warn('Connection test returned no events');
      return false;
    }

    // Test database connection if available
    if (database) {
      const dbConnected = await database.testConnection();
      if (!dbConnected) {
        logger.warn('Database connection failed, continuing without database');
      }
    }

    return true;
  } catch (error) {
    logger.error('Connection test failed', error);
    return false;
  }
};

export const createPolymarketIndexer = () => {
  const client = createPolymarketClient();
  const state = createInitialState();

  return {
    run: async (): Promise<IndexerResult> => {
      const result = await runIndexer(client, state);
      if (result.success) {
        state.lastRunTimestamp = new Date();
      }
      return result;
    },
    testConnection: () => testConnection(client)
  };
};