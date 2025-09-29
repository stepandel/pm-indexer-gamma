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


const calculateStatisticsFromBatches = async (client: ReturnType<typeof createPolymarketClient>) => {
  let totalVolume = 0;
  let totalLiquidity = 0;
  let totalMarkets = 0;
  let activeMarkets = 0;
  const topMarkets: Array<{ question: string; volume: number; liquidity: number; id: string }> = [];

  for await (const batch of client.batchGenerator()) {
    for (const market of batch) {
      totalVolume += market.volumeNum || 0;
      totalLiquidity += market.liquidityNum || 0;
      totalMarkets++;

      if (market.active) {
        activeMarkets++;
      }

      if (market.volumeNum) {
        topMarkets.push({
          question: market.question,
          volume: market.volumeNum,
          liquidity: market.liquidityNum || 0,
          id: market.id
        });
      }
    }
  }

  // Sort and get top 5 by volume
  const top5Markets = topMarkets
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)
    .map(m => ({
      question: m.question,
      volume: m.volume.toFixed(2),
      liquidity: m.liquidity.toFixed(2),
    }));

  return {
    totalMarkets,
    activeMarkets,
    totalVolume,
    totalLiquidity,
    topMarkets: top5Markets
  };
};

const processData = async (marketInfo: { firstMarketId: string | null, lastMarketId: string | null, totalCount: number }, client: ReturnType<typeof createPolymarketClient>): Promise<void> => {
  logger.debug('Processing indexed data');

  const stats = await calculateStatisticsFromBatches(client);

  logger.info('Market statistics', {
    totalMarkets: stats.totalMarkets,
    activeMarkets: stats.activeMarkets,
    totalVolume: stats.totalVolume.toFixed(2),
    totalLiquidity: stats.totalLiquidity.toFixed(2),
  });

  logger.info('Top 5 markets by volume', stats.topMarkets);
};

const runIndexer = async (client: ReturnType<typeof createPolymarketClient>, state: IndexerState): Promise<IndexerResult> => {
  const startTime = Date.now();
  logger.info('Starting Polymarket indexer run');

  try {
    const marketInfo = await fetchActiveMarkets(client, state);

    await processData(marketInfo, client);

    const duration = Date.now() - startTime;
    logger.info(`Indexer run completed successfully in ${duration}ms`, {
      marketsIndexed: marketInfo.totalCount,
    });

    return {
      markets: [], // Not storing markets in memory anymore
      events: [],
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
    const markets = await client.getMarkets({ limit: 1 });

    if (markets && markets.length > 0) {
      logger.info('Connection test successful');
      return true;
    }

    logger.warn('Connection test returned no markets');
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