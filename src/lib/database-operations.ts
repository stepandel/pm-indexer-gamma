import { database } from './database';
import { logger } from './logger';
import type {
  markets,
  market_events,
  tags,
  Prisma
} from '@prisma/client';
import type { MarketEvent, Market, Tags } from '../types/market';

const upsertMarketEvent = async (eventData: any): Promise<market_events | null> => {
  if (!database?.prisma) {
    logger.warn('Database not available, skipping event upsert');
    return null;
  }

  try {
    const result = await database.prisma.market_events.upsert({
      where: { id: eventData.id },
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
    logger.error('Failed to upsert market event', { eventId: eventData.id, error });
    throw error;
  }
};

const upsertMarket = async (marketData: any): Promise<markets | null> => {
  if (!database?.prisma) {
    logger.warn('Database not available, skipping market upsert');
    return null;
  }

  try {
    const result = await database.prisma.markets.upsert({
      where: { id: marketData.id },
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
    logger.error('Failed to upsert market', { marketId: marketData.id, error });
    throw error;
  }
};

// Transform API Market to Database format (1:1 mapping, much simpler!)
const transformMarketToDb = (market: Market, eventId?: string) => {
  return {
    id: market.id,
    question: market.question,
    condition_id: market.conditionId || null,
    slug: market.slug,
    resolution_source: market.resolutionSource || null,
    end_date: market.endDate ? new Date(market.endDate) : null,
    start_date: market.startDate ? new Date(market.startDate) : null,
    image: market.image || null,
    icon: market.icon || null,
    description: market.description || null,
    outcomes: market.outcomes,
    outcome_prices: market.outcomePrices,
    volume: market.volume,
    liquidity: market.liquidity,
    volume_num: market.volumeNum || null,
    liquidity_num: market.liquidityNum || null,
    volume_24hr: market.volume24hr || null,
    volume_1wk: market.volume1wk || null,
    volume_1mo: market.volume1mo || null,
    volume_1yr: market.volume1yr || null,
    volume_clob: market.volumeClob || null,
    liquidity_clob: market.liquidityClob || null,
    volume_24hr_clob: market.volume24hrClob || null,
    volume_1wk_clob: market.volume1wkClob || null,
    volume_1mo_clob: market.volume1moClob || null,
    volume_1yr_clob: market.volume1yrClob || null,
    active: market.active,
    closed: market.closed,
    archived: market.archived,
    new: market.new,
    featured: market.featured,
    restricted: market.restricted,
    accepting_orders: market.acceptingOrders || null,
    neg_risk: market.negRisk || null,
    market_maker_address: market.marketMakerAddress || null,
    submitted_by: market.submitted_by || null,
    resolved_by: market.resolvedBy || null,
    group_item_title: market.groupItemTitle || null,
    group_item_threshold: market.groupItemThreshold || null,
    question_id: market.questionID || null,
    enable_order_book: market.enableOrderBook || null,
    order_price_min_tick_size: market.orderPriceMinTickSize || null,
    order_min_size: market.orderMinSize || null,
    end_date_iso: market.endDateIso || null,
    start_date_iso: market.startDateIso || null,
    has_reviewed_dates: market.hasReviewedDates || null,
    clob_token_ids: market.clobTokenIds || null,
    uma_bond: market.umaBond || null,
    uma_reward: market.umaReward || null,
    custom_liveness: market.customLiveness || null,
    neg_risk_market_id: market.negRiskMarketID || null,
    neg_risk_request_id: market.negRiskRequestID || null,
    created_at: new Date(market.createdAt),
    updated_at: new Date(market.updatedAt),
    market_event_id: eventId || null
  };
};

const transformEventToDb = (event: MarketEvent) => {
  return {
    id: event.id,
    ticker: event.ticker || null,
    slug: event.slug,
    title: event.title,
    description: event.description || null,
    resolution_source: event.resolutionSource || null,
    start_date: event.startDate ? new Date(event.startDate) : null,
    creation_date: event.creationDate ? new Date(event.creationDate) : null,
    end_date: event.endDate ? new Date(event.endDate) : null,
    image: event.image || null,
    icon: event.icon || null,
    active: event.active,
    closed: event.closed,
    archived: event.archived,
    new: event.new,
    featured: event.featured,
    restricted: event.restricted,
    liquidity: event.liquidity || 0,
    volume: event.volume || 0,
    open_interest: event.openInterest || 0,
    competitive: event.competitive || 0,
    volume_24hr: event.volume24hr || null,
    volume_1wk: event.volume1wk || null,
    volume_1mo: event.volume1mo || null,
    volume_1yr: event.volume1yr || null,
    liquidity_clob: event.liquidityClob || null,
    sort_by: event.sortBy || null,
    enable_order_book: event.enableOrderBook || null,
    neg_risk: event.negRisk || null,
    neg_risk_market_id: event.negRiskMarketID || null,
    comment_count: event.commentCount || 0,
    created_at: new Date(event.createdAt),
    updated_at: new Date(event.updatedAt)
  };
};

const saveEventWithMarkets = async (event: MarketEvent): Promise<{ event: market_events | null; markets: markets[]; tags: tags[] }> => {
  const savedMarkets: markets[] = [];
  const savedTags: tags[] = [];

  try {
    // Save event first
    const eventData = transformEventToDb(event);
    const savedEvent = await upsertMarketEvent(eventData);

    // Save tags and link them to the event
    if (event.tags && event.tags.length > 0) {
      for (const tag of event.tags) {
        const tagData = transformTagToDb(tag);
        const savedTag = await upsertTag(tagData);
        if (savedTag) {
          savedTags.push(savedTag);
          // Link tag to event
          await linkEventToTag(event.id, tag.id);
        }
      }
    }

    // Save markets associated with this event
    if (event.markets && event.markets.length > 0) {
      for (const market of event.markets) {
        const marketData = transformMarketToDb(market, event.id);
        const savedMarket = await upsertMarket(marketData);
        if (savedMarket) {
          savedMarkets.push(savedMarket);

          // Link market to same tags as the event (markets inherit event tags)
          if (event.tags && event.tags.length > 0) {
            for (const tag of event.tags) {
              await linkMarketToTag(market.id, tag.id);
            }
          }
        }
      }
    }

    return { event: savedEvent, markets: savedMarkets, tags: savedTags };
  } catch (error) {
    logger.error('Failed to save event with markets and tags', { eventId: event.id, error });
    throw error;
  }
};

const upsertTag = async (tagData: any): Promise<tags | null> => {
  if (!database?.prisma) {
    logger.warn('Database not available, skipping tag upsert');
    return null;
  }

  try {
    const result = await database.prisma.tags.upsert({
      where: { id: tagData.id },
      create: {
        ...tagData,
        updated_at: new Date()
      },
      update: {
        ...tagData,
        updated_at: new Date()
      }
    });

    return result;
  } catch (error) {
    logger.error('Failed to upsert tag', { tagId: tagData.id, error });
    throw error;
  }
};

const linkEventToTag = async (eventId: string, tagId: string): Promise<void> => {
  if (!database?.prisma) {
    logger.warn('Database not available, skipping event-tag link');
    return;
  }

  try {
    await database.prisma.market_event_tags.upsert({
      where: {
        market_event_id_tag_id: {
          market_event_id: eventId,
          tag_id: tagId
        }
      },
      create: {
        market_event_id: eventId,
        tag_id: tagId
      },
      update: {}
    });
  } catch (error) {
    logger.error('Failed to link event to tag', { eventId, tagId, error });
    throw error;
  }
};

const linkMarketToTag = async (marketId: string, tagId: string): Promise<void> => {
  if (!database?.prisma) {
    logger.warn('Database not available, skipping market-tag link');
    return;
  }

  try {
    await database.prisma.market_tags.upsert({
      where: {
        market_id_tag_id: {
          market_id: marketId,
          tag_id: tagId
        }
      },
      create: {
        market_id: marketId,
        tag_id: tagId
      },
      update: {}
    });
  } catch (error) {
    logger.error('Failed to link market to tag', { marketId, tagId, error });
    throw error;
  }
};

const transformTagToDb = (tag: Tags) => {
  return {
    id: tag.id,
    label: tag.label,
    slug: tag.slug
  };
};

export {
  upsertMarketEvent,
  upsertMarket,
  upsertTag,
  linkEventToTag,
  linkMarketToTag,
  transformEventToDb,
  transformMarketToDb,
  transformTagToDb,
  saveEventWithMarkets
};