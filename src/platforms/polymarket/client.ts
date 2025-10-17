import type { PlatformClient } from '../base/platform-interface';
import { request, batchGenerator } from '../../lib/http-client';
import { config } from '../../config/config';
import { logger } from '../../lib/logger';
import type { Market, MarketEvent } from './types';

export class PolymarketClient implements PlatformClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.platforms.polymarket.apiUrl;
  }

  private async getMarkets(params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
    closed?: boolean;
    start_date_min?: string;
  }): Promise<Market[]> {
    try {
      return await request<Market[]>(this.baseUrl, '/markets', params);
    } catch (error) {
      logger.error('Failed to fetch Polymarket markets', error);
      throw error;
    }
  }

  private async fetchEvents(params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
  }): Promise<MarketEvent[]> {
    try {
      return await request<MarketEvent[]>(this.baseUrl, '/events', params);
    } catch (error) {
      logger.error('Failed to fetch Polymarket events', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const events = await this.fetchEvents({ limit: 1 });
      return events && events.length >= 0; // Even 0 events is a successful connection
    } catch (error) {
      return false;
    }
  }

  async getActiveMarkets(): Promise<{ firstMarketId: string | null, lastMarketId: string | null, totalCount: number }> {
    logger.debug('Fetching all active Polymarket markets with pagination');

    let firstMarketId: string | null = null;
    let lastMarketId: string | null = null;
    let totalCount = 0;

    const fetchFn = (params: any) => this.getMarkets({
      ...params,
      active: true,
      start_date_min: '2025-09-25'
    });

    for await (const batch of batchGenerator(fetchFn)) {
      if (batch.length > 0) {
        if (firstMarketId === null) {
          firstMarketId = batch[0].id;
          logger.info(`First Polymarket market ID: ${firstMarketId}`);
        }
        lastMarketId = batch[batch.length - 1].id;
        totalCount += batch.length;
      }
    }

    logger.info(`Last Polymarket market ID: ${lastMarketId}`);
    logger.info(`Total Polymarket markets processed: ${totalCount}`);

    return { firstMarketId, lastMarketId, totalCount };
  }

  async getActiveEvents(): Promise<AsyncGenerator<MarketEvent[], void, unknown>> {
    logger.debug('Fetching all active Polymarket events with pagination');

    const fetchFn = (params: any) => this.fetchEvents({ ...params, active: true });
    return batchGenerator(fetchFn);
  }

  async getEvents(params?: any): Promise<MarketEvent[]> {
    return await request<MarketEvent[]>(this.baseUrl, '/events', params);
  }
}