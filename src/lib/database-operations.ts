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
        id, question, condition_id, slug, resolution_source,
        end_date, start_date, image, icon, description,
        outcomes, outcome_prices, volume, liquidity,
        volume_num, liquidity_num, volume_24hr, volume_1wk, volume_1mo, volume_1yr,
        volume_clob, liquidity_clob, volume_24hr_clob, volume_1wk_clob, volume_1mo_clob, volume_1yr_clob,
        active, closed, archived, new, featured, restricted, accepting_orders, neg_risk,
        market_maker_address, submitted_by, resolved_by,
        group_item_title, group_item_threshold,
        question_id, enable_order_book, order_price_min_tick_size, order_min_size,
        end_date_iso, start_date_iso, has_reviewed_dates,
        clob_token_ids, uma_bond, uma_reward, custom_liveness,
        neg_risk_market_id, neg_risk_request_id,
        created_at, updated_at, market_event_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
        $51, $52, $53
      )
      ON CONFLICT (id) DO UPDATE SET
        question = EXCLUDED.question,
        condition_id = EXCLUDED.condition_id,
        slug = EXCLUDED.slug,
        resolution_source = EXCLUDED.resolution_source,
        end_date = EXCLUDED.end_date,
        start_date = EXCLUDED.start_date,
        image = EXCLUDED.image,
        icon = EXCLUDED.icon,
        description = EXCLUDED.description,
        outcomes = EXCLUDED.outcomes,
        outcome_prices = EXCLUDED.outcome_prices,
        volume = EXCLUDED.volume,
        liquidity = EXCLUDED.liquidity,
        volume_num = EXCLUDED.volume_num,
        liquidity_num = EXCLUDED.liquidity_num,
        volume_24hr = EXCLUDED.volume_24hr,
        volume_1wk = EXCLUDED.volume_1wk,
        volume_1mo = EXCLUDED.volume_1mo,
        volume_1yr = EXCLUDED.volume_1yr,
        volume_clob = EXCLUDED.volume_clob,
        liquidity_clob = EXCLUDED.liquidity_clob,
        volume_24hr_clob = EXCLUDED.volume_24hr_clob,
        volume_1wk_clob = EXCLUDED.volume_1wk_clob,
        volume_1mo_clob = EXCLUDED.volume_1mo_clob,
        volume_1yr_clob = EXCLUDED.volume_1yr_clob,
        active = EXCLUDED.active,
        closed = EXCLUDED.closed,
        archived = EXCLUDED.archived,
        new = EXCLUDED.new,
        featured = EXCLUDED.featured,
        restricted = EXCLUDED.restricted,
        accepting_orders = EXCLUDED.accepting_orders,
        neg_risk = EXCLUDED.neg_risk,
        market_maker_address = EXCLUDED.market_maker_address,
        submitted_by = EXCLUDED.submitted_by,
        resolved_by = EXCLUDED.resolved_by,
        group_item_title = EXCLUDED.group_item_title,
        group_item_threshold = EXCLUDED.group_item_threshold,
        question_id = EXCLUDED.question_id,
        enable_order_book = EXCLUDED.enable_order_book,
        order_price_min_tick_size = EXCLUDED.order_price_min_tick_size,
        order_min_size = EXCLUDED.order_min_size,
        end_date_iso = EXCLUDED.end_date_iso,
        start_date_iso = EXCLUDED.start_date_iso,
        has_reviewed_dates = EXCLUDED.has_reviewed_dates,
        clob_token_ids = EXCLUDED.clob_token_ids,
        uma_bond = EXCLUDED.uma_bond,
        uma_reward = EXCLUDED.uma_reward,
        custom_liveness = EXCLUDED.custom_liveness,
        neg_risk_market_id = EXCLUDED.neg_risk_market_id,
        neg_risk_request_id = EXCLUDED.neg_risk_request_id,
        updated_at = EXCLUDED.updated_at,
        market_event_id = EXCLUDED.market_event_id,
        last_updated = NOW()
      RETURNING *;
    `;

    const values = [
      marketData.id,
      marketData.question,
      marketData.condition_id,
      marketData.slug,
      marketData.resolution_source,
      marketData.end_date,
      marketData.start_date,
      marketData.image,
      marketData.icon,
      marketData.description,
      marketData.outcomes,
      marketData.outcome_prices,
      marketData.volume,
      marketData.liquidity,
      marketData.volume_num,
      marketData.liquidity_num,
      marketData.volume_24hr,
      marketData.volume_1wk,
      marketData.volume_1mo,
      marketData.volume_1yr,
      marketData.volume_clob,
      marketData.liquidity_clob,
      marketData.volume_24hr_clob,
      marketData.volume_1wk_clob,
      marketData.volume_1mo_clob,
      marketData.volume_1yr_clob,
      marketData.active,
      marketData.closed,
      marketData.archived,
      marketData.new,
      marketData.featured,
      marketData.restricted,
      marketData.accepting_orders,
      marketData.neg_risk,
      marketData.market_maker_address,
      marketData.submitted_by,
      marketData.resolved_by,
      marketData.group_item_title,
      marketData.group_item_threshold,
      marketData.question_id,
      marketData.enable_order_book,
      marketData.order_price_min_tick_size,
      marketData.order_min_size,
      marketData.end_date_iso,
      marketData.start_date_iso,
      marketData.has_reviewed_dates,
      marketData.clob_token_ids,
      marketData.uma_bond,
      marketData.uma_reward,
      marketData.custom_liveness,
      marketData.neg_risk_market_id,
      marketData.neg_risk_request_id,
      marketData.created_at,
      marketData.updated_at,
      marketData.market_event_id
    ];

    const result = await database.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to upsert market', { marketId: marketData.id, error });
    throw error;
  }
};

// Transform API Market to Database format (1:1 mapping, much simpler!)
const transformMarketToDb = (market: Market, eventId?: string): MarketsInsert => {
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
    volume: event.volume || '0',
    liquidity: event.liquidity || '0'
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