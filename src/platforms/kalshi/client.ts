import type { PlatformClient } from '../base/platform-interface';
import { request } from '../../lib/http-client';
import { config } from '../../config/config';
import { logger } from '../../lib/logger';
import type { KalshiEvent, KalshiApiResponse } from './types';

export class KalshiClient implements PlatformClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.platforms.kalshi.apiUrl;
  }

  private async fetchEvents(params: {
    limit?: number;
    cursor?: string;
    with_nested_markets?: boolean;
  } = {}): Promise<KalshiApiResponse> {
    try {
      const defaultParams = {
        limit: 200,
        with_nested_markets: true,
        ...params
      };

      return await request<KalshiApiResponse>(
        this.baseUrl,
        '/trade-api/v2/events',
        defaultParams
      );
    } catch (error) {
      logger.error('Failed to fetch Kalshi events', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.fetchEvents({ limit: 1 });
      return result && Array.isArray(result.events);
    } catch (error) {
      return false;
    }
  }

  async getActiveMarkets(): Promise<{ firstMarketId: string | null, lastMarketId: string | null, totalCount: number }> {
    logger.debug('Fetching all active Kalshi markets with pagination');

    let firstMarketId: string | null = null;
    let lastMarketId: string | null = null;
    let totalCount = 0;
    let cursor: string | undefined;

    do {
      const response = await this.fetchEvents({ cursor });

      if (response.events && response.events.length > 0) {
        for (const event of response.events) {
          if (event.markets && event.markets.length > 0) {
            for (const market of event.markets) {
              if (firstMarketId === null) {
                firstMarketId = market.ticker;
                logger.info(`First Kalshi market ID: ${firstMarketId}`);
              }
              lastMarketId = market.ticker;
              totalCount++;
            }
          }
        }
      }

      cursor = response.cursor;
    } while (cursor);

    logger.info(`Last Kalshi market ID: ${lastMarketId}`);
    logger.info(`Total Kalshi markets processed: ${totalCount}`);

    return { firstMarketId, lastMarketId, totalCount };
  }

  async getActiveEvents(): Promise<AsyncGenerator<KalshiEvent[], void, unknown>> {
    logger.debug('Fetching all active Kalshi events with pagination');

    return this.getAllEvents();
  }

  private async* getAllEvents(): AsyncGenerator<KalshiEvent[], void, unknown> {
    let cursor: string | undefined;

    do {
      try {
        const response = await this.fetchEvents({ cursor });

        if (response.events && response.events.length > 0) {
          logger.debug(`Fetched Kalshi batch: ${response.events.length} events`);
          yield response.events;
        }

        cursor = response.cursor;
      } catch (error) {
        logger.error('Failed to fetch Kalshi events batch', error);
        throw error;
      }
    } while (cursor);
  }

  async getEvents(params?: any): Promise<KalshiEvent[]> {
    const response = await this.fetchEvents(params);
    return response.events || [];
  }
}