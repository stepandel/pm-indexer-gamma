import { logger } from "@prediction-markets/shared";
import { BaseProcessor } from "./base.js";
import { ProcessingResult, ProcessingStats } from "../types.js";

/**
 * Kalshi-specific date extraction processor
 */
export class KalshiProcessor extends BaseProcessor {
  private readonly tableName = "kalshi.event_date";
  private readonly eventsTable = "kalshi.events";
  private readonly marketsTable = "kalshi.markets";

  /**
   * Get the maximum close_time from all markets for a given event
   */
  private async getMaxCloseTimeForEvent(
    eventTicker: string
  ): Promise<Date | null> {
    try {
      const query = `
        SELECT MAX(close_time) as max_close_time
        FROM ${this.marketsTable}
        WHERE event_ticker = $1 AND close_time IS NOT NULL
      `;

      const result = await this.db.query(query, [eventTicker]);
      const maxCloseTime = result?.rows?.[0]?.max_close_time;

      return maxCloseTime ? new Date(maxCloseTime) : null;
    } catch (error) {
      logger.error(
        `Failed to get max close_time for event ${eventTicker}:`,
        error
      );
      return null;
    }
  }

  /**
   * Process Kalshi events for date extraction
   */
  async processEventsForDates(
    offset: number = 0,
    limit: number = 1000
  ): Promise<ProcessingResult> {
    const results: ProcessingResult = {
      processed: 0,
      datesFound: 0,
      eventsUpdated: 0,
      errors: 0,
    };

    try {
      // Get events from Kalshi
      const query = `
        SELECT event_ticker, title, sub_title, category
        FROM ${this.eventsTable}
        ORDER BY event_ticker
        LIMIT $1 OFFSET $2
      `;

      const result = await this.db.query(query, [limit, offset]);
      const events = result?.rows || [];

      if (events.length === 0) {
        return results;
      }

      logger.info(
        `📦 Processing batch: ${events.length} Kalshi events (offset ${offset})`
      );

      for (const event of events) {
        try {
          // Extract dates from this event
          const dates = this.dateExtractor.extractEventDates({
            title: event.title,
            description: event.sub_title,
            slug: event.event_ticker,
          });

          // Find the best date (highest confidence)
          let bestDate = dates.reduce((prev, current) =>
            current.confidence > prev.confidence ? current : prev
          );

          // If no date found or confidence too low, try fallback to market close_time
          if (!bestDate || bestDate.confidence < 0.6) {
            const maxCloseTime = await this.getMaxCloseTimeForEvent(
              event.event_ticker
            );

            if (maxCloseTime) {
              bestDate = {
                dateTime: maxCloseTime,
                confidence: 0.5, // Lower confidence for fallback dates
                matchedText: "fallback_market_close_time",
                source: "market_close_time",
                patternType: "market_fallback",
              };

              if (!dates.length) {
                results.datesFound += 1; // Count fallback as found date
              }
            }
          }

          // Store the date if we have one above threshold
          if (bestDate && bestDate.confidence >= 0.5) {
            // Lower threshold to include fallback dates
            if (
              await this.upsertEventDate(
                event.event_ticker,
                bestDate,
                this.tableName
              )
            ) {
              results.eventsUpdated += 1;
              logger.info(
                `   ✓ Event ${event.event_ticker}: ${bestDate.dateTime.toISOString().split("T")[0]} (confidence: ${bestDate.confidence.toFixed(2)}) [${bestDate.source}]`
              );
            }
          }

          results.processed += 1;

          // Progress indicator (less frequent for speed)
          if (results.processed % 100 === 0) {
            logger.info(
              `   ⚙️  Processed ${results.processed}/${events.length} events...`
            );
          }
        } catch (error) {
          logger.error(
            `   ✗ Error processing event ${event.event_ticker}:`,
            error
          );
          results.errors += 1;
        }
      }

      logger.info(
        `   ✓ Batch completed: ${results.eventsUpdated} events updated`
      );
    } catch (error) {
      logger.error("✗ Batch processing failed:", error);
      results.errors = limit;
    }

    return results;
  }

  /**
   * Get Kalshi date extraction statistics
   */
  async getDateExtractionStats(): Promise<ProcessingStats> {
    try {
      // Total event dates
      const totalDatesResult = await this.db.query(
        `SELECT COUNT(*) as total FROM ${this.tableName}`
      );
      const totalDates = parseInt(totalDatesResult?.rows?.[0]?.total || "0");

      // Confidence distribution
      const confidenceDistResult = await this.db.query(`
        SELECT
          CASE
            WHEN confidence >= 0.9 THEN 'high'
            WHEN confidence >= 0.7 THEN 'medium'
            ELSE 'low'
          END as confidence_level,
          COUNT(*) as count
        FROM ${this.tableName}
        GROUP BY confidence_level
        ORDER BY confidence_level DESC
      `);

      // Sample extracted dates
      const sampleDatesResult = await this.db.query(`
        SELECT event_id, event_time_utc, confidence
        FROM ${this.tableName}
        ORDER BY confidence DESC, updated_at DESC
        LIMIT 10
      `);

      // Total events vs events with dates
      const totalEventsResult = await this.db.query(
        `SELECT COUNT(*) as total FROM ${this.eventsTable}`
      );
      const totalEvents = parseInt(totalEventsResult?.rows?.[0]?.total || "0");

      return {
        totalDates,
        totalEvents,
        coveragePercent:
          totalEvents > 0
            ? Math.round((totalDates / totalEvents) * 100 * 100) / 100
            : 0,
        confidenceDistribution: (confidenceDistResult?.rows || []).map(
          (row) => ({
            confidenceLevel: row.confidence_level,
            count: parseInt(row.count),
          })
        ),
        sampleDates: (sampleDatesResult?.rows || []).map((row) => ({
          eventId: row.event_id,
          eventTimeUtc: row.event_time_utc,
          confidence: parseFloat(row.confidence),
        })),
      };
    } catch (error) {
      logger.error("✗ Failed to get Kalshi date extraction stats:", error);
      return {
        totalDates: 0,
        totalEvents: 0,
        coveragePercent: 0,
        confidenceDistribution: [],
        sampleDates: [],
      };
    }
  }

  /**
   * Process sample Kalshi events in test mode
   */
  async processTestMode(): Promise<void> {
    logger.info("\n🧪 Testing date extraction on sample Kalshi events...");

    try {
      const query = `
        SELECT event_ticker, title, sub_title, category
        FROM ${this.eventsTable}
        WHERE title ILIKE '%october%' OR title ILIKE '%2025%' OR event_ticker ILIKE '%2025%'
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const result = await this.db.query(query);
      const sampleEvents = result?.rows || [];

      for (let i = 0; i < sampleEvents.length; i++) {
        const event = sampleEvents[i];
        logger.info(`\n--- Event ${i + 1}: ${event.event_ticker} ---`);
        logger.info(`Title: ${event.title}`);
        logger.info(`Subtitle: ${event.sub_title || "N/A"}`);
        logger.info(`Category: ${event.category || "N/A"}`);

        // Extract dates
        const dates = this.dateExtractor.extractEventDates({
          title: event.title,
          description: event.sub_title,
          slug: event.event_ticker,
        });

        if (dates.length > 0) {
          logger.info(`📅 Found ${dates.length} date matches:`);
          for (const dateMatch of dates.sort(
            (a, b) => b.confidence - a.confidence
          )) {
            logger.info(
              `   • ${dateMatch.dateTime.toISOString().split("T")[0]}: "${dateMatch.matchedText}"`
            );
            logger.info(
              `     Confidence: ${dateMatch.confidence.toFixed(2)}, Source: ${dateMatch.source}`
            );
            logger.info(`     Pattern: ${dateMatch.patternType}`);
            if (dateMatch.timeRange) {
              logger.info(`     Time: ${dateMatch.timeRange}`);
            }
            if (dateMatch.timezoneAbbr) {
              logger.info(`     Timezone: ${dateMatch.timezoneAbbr}`);
            }
          }
        } else {
          logger.info("   No dates found");
        }
      }
    } catch (error) {
      logger.error("✗ Error in test mode:", error);
    }
  }

  /**
   * Process all Kalshi events in batches
   */
  async processFullMode(batchSize: number): Promise<void> {
    logger.info(`\n🚀 Processing ALL Kalshi events in batches of ${batchSize}`);

    // Get stats before processing
    const statsBefore = await this.getDateExtractionStats();
    this.printDateStats("Stats before processing", statsBefore);

    const totalEvents = statsBefore.totalEvents;
    let totalProcessed = 0;
    let totalDates = 0;
    let totalEventsUpdated = 0;
    let totalErrors = 0;

    let batchNum = 1;
    let offset = 0;

    while (offset < totalEvents) {
      const remaining = totalEvents - offset;
      const currentBatchSize = Math.min(batchSize, remaining);

      logger.info(
        `\n--- Batch ${batchNum} (${offset + 1}-${offset + currentBatchSize} of ${totalEvents}) ---`
      );

      const results = await this.processEventsForDates(
        offset,
        currentBatchSize
      );

      totalProcessed += results.processed;
      totalDates += results.datesFound;
      totalEventsUpdated += results.eventsUpdated;
      totalErrors += results.errors;

      logger.info(
        `Progress: ${totalProcessed}/${totalEvents} events (${((totalProcessed / totalEvents) * 100).toFixed(1)}%)`
      );

      offset += currentBatchSize;
      batchNum += 1;
    }

    logger.info(`\n🎉 Full Kalshi processing completed!`);
    logger.info(`   Total processed: ${totalProcessed} events`);
    logger.info(`   Total dates found: ${totalDates}`);
    logger.info(`   Total events updated: ${totalEventsUpdated}`);
    logger.info(`   Total errors: ${totalErrors}`);

    // Get stats after processing
    const statsAfter = await this.getDateExtractionStats();
    this.printDateStats("Stats after processing", statsAfter);
  }
}
