import type { PlatformDatabaseOperations } from '../base/platform-interface';
import { database } from '../../lib/database';
import { logger } from '../../lib/logger';
import type { KalshiEvent, KalshiMarket } from './types';

export class KalshiDatabaseOperations implements PlatformDatabaseOperations {
  async upsertMarket(marketData: any): Promise<any> {
    if (!database?.prisma) {
      logger.warn('Database not available, skipping Kalshi market upsert');
      return null;
    }

    try {
      const result = await database.prisma.kalshi_markets.upsert({
        where: { ticker: marketData.ticker },
        create: {
          ...marketData,
          last_updated: new Date()
        },
        update: {
          ...marketData,
          last_updated: new Date()
        }
      });

      return result;
    } catch (error) {
      logger.error('Failed to upsert Kalshi market', { ticker: marketData.ticker, error });
      throw error;
    }
  }

  async upsertEvent(eventData: any): Promise<any> {
    if (!database?.prisma) {
      logger.warn('Database not available, skipping Kalshi event upsert');
      return null;
    }

    try {
      const result = await database.prisma.kalshi_events.upsert({
        where: { event_ticker: eventData.event_ticker },
        create: {
          ...eventData,
          last_updated: new Date()
        },
        update: {
          ...eventData,
          last_updated: new Date()
        }
      });

      return result;
    } catch (error) {
      logger.error('Failed to upsert Kalshi event', { event_ticker: eventData.event_ticker, error });
      throw error;
    }
  }

  async upsertTag(tagData: any): Promise<any> {
    // Kalshi doesn't have tags in the same way as Polymarket
    // We could use category as a simple tag system
    logger.debug('Kalshi tag upsert not implemented - using categories directly');
    return null;
  }

  async linkEventToTag(eventId: string, tagId: string): Promise<void> {
    // Kalshi doesn't have separate tags - categories are part of events
    logger.debug('Kalshi event-tag linking not implemented - using categories directly');
  }

  async linkMarketToTag(marketId: string, tagId: string): Promise<void> {
    // Kalshi doesn't have separate tags - categories are inherited from events
    logger.debug('Kalshi market-tag linking not implemented - using categories directly');
  }

  private transformEventToDb(event: KalshiEvent) {
    return {
      event_ticker: event.event_ticker || "",
      series_ticker: event.series_ticker || "",
      title: event.title || "",
      sub_title: event.sub_title || null,
      category: event.category || null,
      collateral_return_type: event.collateral_return_type || null,
      mutually_exclusive: event.mutually_exclusive ?? false,
      price_level_structure: event.price_level_structure || null,
      available_on_brokers: event.available_on_brokers ?? false,
    };
  }

  private transformMarketToDb(market: KalshiMarket) {
    return {
      ticker: market.ticker || "",
      event_ticker: market.event_ticker || "",
      market_type: market.market_type || null,
      title: market.title || "",
      subtitle: market.subtitle || null,
      yes_sub_title: market.yes_sub_title || null,
      no_sub_title: market.no_sub_title || null,
      open_time: market.open_time ? new Date(market.open_time) : null,
      close_time: market.close_time ? new Date(market.close_time) : null,
      expected_expiration_time: market.expected_expiration_time ? new Date(market.expected_expiration_time) : null,
      expiration_time: market.expiration_time ? new Date(market.expiration_time) : null,
      latest_expiration_time: market.latest_expiration_time ? new Date(market.latest_expiration_time) : null,
      settlement_timer_seconds: market.settlement_timer_seconds ?? null,
      status: market.status || null,
      response_price_units: market.response_price_units || null,
      can_close_early: market.can_close_early ?? false,
      rules_primary: market.rules_primary || null,
      notional_value: market.notional_value ?? null,
      notional_value_dollars: market.notional_value_dollars || null,
      yes_bid: market.yes_bid ?? null,
      yes_ask: market.yes_ask ?? null,
      no_bid: market.no_bid ?? null,
      no_ask: market.no_ask ?? null,
      last_price: market.last_price ?? null,
      previous_price: market.previous_price ?? null,
      previous_yes_bid: market.previous_yes_bid ?? null,
      previous_yes_ask: market.previous_yes_ask ?? null,
      previous_no_bid: market.previous_no_bid ?? null,
      previous_no_ask: market.previous_no_ask ?? null,
      volume: market.volume ?? 0,
      liquidity: market.liquidity ?? 0,
      liquidity_dollars: market.liquidity_dollars || null,
      open_interest: market.open_interest ?? 0,
    };
  }

  async saveEventWithMarkets(event: KalshiEvent): Promise<any> {
    const savedMarkets: any[] = [];

    try {
      // Save event first
      const eventData = this.transformEventToDb(event);
      const savedEvent = await this.upsertEvent(eventData);

      // Save markets associated with this event
      if (event.markets && event.markets.length > 0) {
        for (const market of event.markets) {
          const marketData = this.transformMarketToDb(market);
          const savedMarket = await this.upsertMarket(marketData);
          if (savedMarket) {
            savedMarkets.push(savedMarket);
          }
        }
      }

      return { event: savedEvent, markets: savedMarkets, tags: [] };
    } catch (error) {
      logger.error('Failed to save Kalshi event with markets', { event_ticker: event.event_ticker, error });
      throw error;
    }
  }
}