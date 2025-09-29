import { createPolymarketClient } from './polymarket-client';
import { logger } from './logger';
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
    const eventInfo = await client.getActiveEvents();

    if (eventInfo.totalCount > 0) {
      logger.info(`Found ${eventInfo.totalCount} active events`);
      logger.info(`First event ID: ${eventInfo.firstEventId}`);
      logger.info(`Last event ID: ${eventInfo.lastEventId}`);
    }

    return eventInfo;
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
      return true;
    }

    logger.warn('Connection test returned no events');
    return false;
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