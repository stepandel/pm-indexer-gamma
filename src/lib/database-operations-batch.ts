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

const batchUpsertEvents = async (events: MarketEventsInsert[]): Promise<MarketEventsDB[]> => {
  if (!database || events.length === 0) return [];

  try {
    const values = events.flatMap(e => [
      e.id, e.slug, e.title, e.description, e.image, e.icon,
      e.active, e.closed, e.restricted, e.volume, e.liquidity
    ]);

    const placeholders = events.map((_, idx) => {
      const base = idx * 11;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11})`;
    }).join(', ');

    const query = `
      INSERT INTO market_events (
        id, slug, title, description, image, icon, active, closed, restricted, volume, liquidity
      ) VALUES ${placeholders}
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

    const result = await database.query(query, values);
    return result.rows;
  } catch (error) {
    logger.error('Failed to batch upsert events', error);
    throw error;
  }
};

const batchUpsertMarkets = async (markets: MarketsInsert[]): Promise<MarketsDB[]> => {
  if (!database || markets.length === 0) return [];

  try {
    const values = markets.flatMap(m => [
      m.id, m.question, m.outcome1, m.outcome2, m.price1, m.price2,
      m.winner, m.volume, m.image, m.description, m.start_time,
      m.end_time, m.game_start_time, m.polymarket_id, m.market_event_id
    ]);

    const placeholders = markets.map((_, idx) => {
      const base = idx * 15;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15})`;
    }).join(', ');

    const query = `
      INSERT INTO markets (
        id, question, outcome1, outcome2, price1, price2, winner, volume, image, description,
        start_time, end_time, game_start_time, polymarket_id, market_event_id
      ) VALUES ${placeholders}
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

    const result = await database.query(query, values);
    return result.rows;
  } catch (error) {
    logger.error('Failed to batch upsert markets', error);
    throw error;
  }
};

const batchUpsertTags = async (tags: TagsInsert[]): Promise<TagsDB[]> => {
  if (!database || tags.length === 0) return [];

  try {
    const values = tags.flatMap(t => [t.id, t.label, t.slug]);

    const placeholders = tags.map((_, idx) => {
      const base = idx * 3;
      return `($${base + 1}, $${base + 2}, $${base + 3})`;
    }).join(', ');

    const query = `
      INSERT INTO tags (id, label, slug)
      VALUES ${placeholders}
      ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label,
        slug = EXCLUDED.slug,
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await database.query(query, values);
    return result.rows;
  } catch (error) {
    logger.error('Failed to batch upsert tags', error);
    throw error;
  }
};

const batchLinkEventTags = async (links: Array<{ eventId: string; tagId: string }>): Promise<void> => {
  if (!database || links.length === 0) return;

  try {
    const values = links.flatMap(l => [l.eventId, l.tagId]);

    const placeholders = links.map((_, idx) => {
      const base = idx * 2;
      return `($${base + 1}, $${base + 2})`;
    }).join(', ');

    const query = `
      INSERT INTO market_event_tags (market_event_id, tag_id)
      VALUES ${placeholders}
      ON CONFLICT (market_event_id, tag_id) DO NOTHING;
    `;

    await database.query(query, values);
  } catch (error) {
    logger.error('Failed to batch link event tags', error);
    throw error;
  }
};

const batchLinkMarketTags = async (links: Array<{ marketId: string; tagId: string }>): Promise<void> => {
  if (!database || links.length === 0) return;

  try {
    const values = links.flatMap(l => [l.marketId, l.tagId]);

    const placeholders = links.map((_, idx) => {
      const base = idx * 2;
      return `($${base + 1}, $${base + 2})`;
    }).join(', ');

    const query = `
      INSERT INTO market_tags (market_id, tag_id)
      VALUES ${placeholders}
      ON CONFLICT (market_id, tag_id) DO NOTHING;
    `;

    await database.query(query, values);
  } catch (error) {
    logger.error('Failed to batch link market tags', error);
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

const transformTagToDb = (tag: Tags): TagsInsert => {
  return {
    id: tag.id,
    label: tag.label,
    slug: tag.slug
  };
};

const processBatchEvents = async (events: MarketEvent[]): Promise<{
  events: MarketEventsDB[];
  markets: MarketsDB[];
  tags: TagsDB[];
}> => {
  if (!database) {
    logger.warn('Database not available, skipping batch processing');
    return { events: [], markets: [], tags: [] };
  }

  try {
    // Prepare all data for batch operations
    const eventInserts = events.map(transformEventToDb);
    const marketInserts: MarketsInsert[] = [];
    const tagMap = new Map<string, TagsInsert>();
    const eventTagLinks: Array<{ eventId: string; tagId: string }> = [];
    const marketTagLinks: Array<{ marketId: string; tagId: string }> = [];

    // Collect all unique tags and prepare market/tag relationships
    for (const event of events) {
      // Collect tags from events
      if (event.tags && event.tags.length > 0) {
        for (const tag of event.tags) {
          if (!tagMap.has(tag.id)) {
            tagMap.set(tag.id, transformTagToDb(tag));
          }
          eventTagLinks.push({ eventId: event.id, tagId: tag.id });
        }
      }

      // Collect markets and their tag relationships
      if (event.markets && event.markets.length > 0) {
        for (const market of event.markets) {
          marketInserts.push(transformMarketToDb(market, event.id));

          // Markets inherit tags from their parent event
          if (event.tags && event.tags.length > 0) {
            for (const tag of event.tags) {
              marketTagLinks.push({ marketId: market.id, tagId: tag.id });
            }
          }
        }
      }
    }

    const tagInserts = Array.from(tagMap.values());

    // Execute batch operations in parallel where possible
    const [savedEvents, savedTags] = await Promise.all([
      batchUpsertEvents(eventInserts),
      batchUpsertTags(tagInserts)
    ]);

    // Markets depend on events being saved first
    const savedMarkets = await batchUpsertMarkets(marketInserts);

    // Link tags in parallel (these can happen after main entities are saved)
    await Promise.all([
      batchLinkEventTags(eventTagLinks),
      batchLinkMarketTags(marketTagLinks)
    ]);

    logger.debug(`Batch processed: ${savedEvents.length} events, ${savedMarkets.length} markets, ${savedTags.length} tags`);

    return {
      events: savedEvents,
      markets: savedMarkets,
      tags: savedTags
    };
  } catch (error) {
    logger.error('Failed to process batch events', error);
    throw error;
  }
};

export {
  processBatchEvents,
  batchUpsertEvents,
  batchUpsertMarkets,
  batchUpsertTags,
  batchLinkEventTags,
  batchLinkMarketTags,
  transformEventToDb,
  transformMarketToDb,
  transformTagToDb
};