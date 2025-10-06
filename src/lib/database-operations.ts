import { database } from './database';
import { logger } from './logger';
import type {
  MarketEventsInsert,
  MarketsInsert,
  MarketEventsDB,
  MarketsDB,
  TagsInsert,
  TagsDB,
  MarketEventTagsInsert,
  MarketTagsInsert
} from '../types/database';
import type { MarketEvent, Market, Tags } from '../types/market';
import { getMarketWinner } from './outcome-determination';

const upsertMarketEvent = async (eventData: MarketEventsInsert): Promise<MarketEventsDB | null> => {
  if (!database) {
    logger.warn('Database not available, skipping event upsert');
    return null;
  }

  try {
    const query = `
      INSERT INTO market_events (
        id, slug, title, description, image, icon, active, closed, restricted, volume, liquidity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        image = EXCLUDED.image,
        icon = EXCLUDED.icon,
        active = EXCLUDED.active,
        closed = EXCLUDED.closed,
        restricted = EXCLUDED.restricted,
        volume = EXCLUDED.volume,
        liquidity = EXCLUDED.liquidity,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      eventData.id,
      eventData.slug,
      eventData.title,
      eventData.description,
      eventData.image,
      eventData.icon,
      eventData.active,
      eventData.closed,
      eventData.restricted,
      eventData.volume,
      eventData.liquidity
    ];

    const result = await database.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to upsert market event', { eventId: eventData.id, error });
    throw error;
  }
};

const upsertMarket = async (marketData: MarketsInsert): Promise<MarketsDB | null> => {
  if (!database) {
    logger.warn('Database not available, skipping market upsert');
    return null;
  }

  try {
    const query = `
      INSERT INTO markets (
        id, question, outcome1, outcome2, price1, price2, winner, volume, image, description,
        start_time, end_time, game_start_time, polymarket_id, market_event_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        question = EXCLUDED.question,
        outcome1 = EXCLUDED.outcome1,
        outcome2 = EXCLUDED.outcome2,
        price1 = EXCLUDED.price1,
        price2 = EXCLUDED.price2,
        winner = EXCLUDED.winner,
        volume = EXCLUDED.volume,
        image = EXCLUDED.image,
        description = EXCLUDED.description,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        game_start_time = EXCLUDED.game_start_time,
        polymarket_id = EXCLUDED.polymarket_id,
        market_event_id = EXCLUDED.market_event_id,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      marketData.id,
      marketData.question,
      marketData.outcome1,
      marketData.outcome2,
      marketData.price1,
      marketData.price2,
      marketData.winner,
      marketData.volume,
      marketData.image,
      marketData.description,
      marketData.start_time,
      marketData.end_time,
      marketData.game_start_time,
      marketData.polymarket_id,
      marketData.market_event_id
    ];

    const result = await database.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to upsert market', { marketId: marketData.id, error });
    throw error;
  }
};

const transformEventToDb = (event: MarketEvent): MarketEventsInsert => {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description || null,
    image: event.image || null,
    icon: event.icon || null,
    active: event.active,
    closed: event.closed,
    restricted: event.restricted,
    volume: event.volume || null,
    liquidity: event.liquidity || null
  };
};

const transformMarketToDb = (market: Market, eventId?: string): MarketsInsert => {
  const outcomes = market.outcomes ? JSON.parse(market.outcomes) : [];
  const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : [];

  // Determine winner based on market state and prices
  const winner = getMarketWinner(market);

  return {
    id: market.id,
    question: market.question,
    outcome1: outcomes[0] || 'Yes',
    outcome2: outcomes[1] || 'No',
    price1: prices[0] || '0.5',
    price2: prices[1] || '0.5',
    winner,
    volume: market.volume || null,
    image: market.image || null,
    description: market.description || null,
    start_time: market.startDate ? new Date(market.startDate) : null,
    end_time: market.endDate ? new Date(market.endDate) : null,
    game_start_time: market.gameStartTime ? new Date(market.gameStartTime) : null,
    polymarket_id: market.conditionId || null,
    market_event_id: eventId || null
  };
};

const saveEventWithMarkets = async (event: MarketEvent): Promise<{ event: MarketEventsDB | null; markets: MarketsDB[]; tags: TagsDB[] }> => {
  const savedMarkets: MarketsDB[] = [];
  const savedTags: TagsDB[] = [];

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

const upsertTag = async (tagData: TagsInsert): Promise<TagsDB | null> => {
  if (!database) {
    logger.warn('Database not available, skipping tag upsert');
    return null;
  }

  try {
    const query = `
      INSERT INTO tags (id, label, slug)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label,
        slug = EXCLUDED.slug,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [tagData.id, tagData.label, tagData.slug];
    const result = await database.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to upsert tag', { tagId: tagData.id, error });
    throw error;
  }
};

const linkEventToTag = async (eventId: string, tagId: string): Promise<void> => {
  if (!database) {
    logger.warn('Database not available, skipping event-tag link');
    return;
  }

  try {
    const query = `
      INSERT INTO market_event_tags (market_event_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT (market_event_id, tag_id) DO NOTHING;
    `;

    await database.query(query, [eventId, tagId]);
  } catch (error) {
    logger.error('Failed to link event to tag', { eventId, tagId, error });
    throw error;
  }
};

const linkMarketToTag = async (marketId: string, tagId: string): Promise<void> => {
  if (!database) {
    logger.warn('Database not available, skipping market-tag link');
    return;
  }

  try {
    const query = `
      INSERT INTO market_tags (market_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT (market_id, tag_id) DO NOTHING;
    `;

    await database.query(query, [marketId, tagId]);
  } catch (error) {
    logger.error('Failed to link market to tag', { marketId, tagId, error });
    throw error;
  }
};

const transformTagToDb = (tag: Tags): TagsInsert => {
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