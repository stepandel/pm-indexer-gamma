import { config } from '../config/config';
import { logger } from './logger';
import type { Market } from '../types/market';

const request = async <T>(baseUrl: string, path: string, params?: Record<string, any>): Promise<T> => {
  const url = new URL(path, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error('Polymarket API error', {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Request failed', { error: error.message });
    }
    throw error;
  }
};

export const createPolymarketClient = (baseUrl: string = config.polymarket.apiUrl) => {
  const getMarkets = async (params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
    closed?: boolean;
    start_date_min?: string;
  }): Promise<Market[]> => {
    try {
      return await request<Market[]>(baseUrl, '/markets', params);
    } catch (error) {
      logger.error('Failed to fetch markets', error);
      throw error;
    }
  };


  const fetchBatch = async (limit: number, offset: number): Promise<Market[]> => {
    return await getMarkets({
      active: true,
      limit,
      offset,
      start_date_min: '2025-09-25'
    });
  };

  async function* batchGenerator(limit: number = 500): AsyncGenerator<Market[], void, unknown> {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const batch = await fetchBatch(limit, offset);

        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        logger.debug(`Fetched batch: ${batch.length} markets at offset ${offset}`);
        yield batch;

        offset += batch.length;
      } catch (error) {
        logger.error(`Failed to fetch batch at offset ${offset}`, error);
        throw error;
      }
    }
  }

  const getActiveMarkets = async (): Promise<{ firstMarketId: string | null, lastMarketId: string | null, totalCount: number }> => {
    logger.debug('Fetching all active markets with pagination');

    let firstMarketId: string | null = null;
    let lastMarketId: string | null = null;
    let totalCount = 0;

    for await (const batch of batchGenerator()) {
      if (batch.length > 0) {
        if (firstMarketId === null) {
          firstMarketId = batch[0].id;
          logger.info(`First market ID: ${firstMarketId}`);
        }
        lastMarketId = batch[batch.length - 1].id;
        totalCount += batch.length;
      }
    }

    logger.info(`Last market ID: ${lastMarketId}`);
    logger.info(`Total markets processed: ${totalCount}`);

    return { firstMarketId, lastMarketId, totalCount };
  };

  return {
    getMarkets,
    getActiveMarkets,
    batchGenerator
  };
};