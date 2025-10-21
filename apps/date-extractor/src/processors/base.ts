import { DateExtractor, database, logger } from '@prediction-markets/shared';
import { DateMatch, ProcessingResult, ProcessingStats } from '../types.js';

/**
 * Base processor class with shared functionality for date extraction
 */
export abstract class BaseProcessor {
  protected dateExtractor: DateExtractor;
  protected db: typeof database;

  constructor() {
    this.dateExtractor = new DateExtractor();
    this.db = database;
  }

  /**
   * Process events for date extraction
   */
  abstract processEventsForDates(offset?: number, limit?: number): Promise<ProcessingResult>;

  /**
   * Get date extraction statistics
   */
  abstract getDateExtractionStats(): Promise<ProcessingStats>;

  /**
   * Upsert an event date to the database
   */
  protected async upsertEventDate(
    eventId: string,
    dateMatch: DateMatch,
    tableName: string
  ): Promise<boolean> {
    try {
      const upsertQuery = `
        INSERT INTO ${tableName} (event_id, event_time_utc, confidence, extracted_text, pattern_type, timezone_abbr, time_range, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (event_id)
        DO UPDATE SET
          event_time_utc = EXCLUDED.event_time_utc,
          confidence = EXCLUDED.confidence,
          extracted_text = EXCLUDED.extracted_text,
          pattern_type = EXCLUDED.pattern_type,
          timezone_abbr = EXCLUDED.timezone_abbr,
          time_range = EXCLUDED.time_range,
          updated_at = EXCLUDED.updated_at
      `;

      const now = new Date();

      await this.db.query(upsertQuery, [
        eventId,
        dateMatch.dateTime,
        dateMatch.confidence,
        dateMatch.matchedText,
        dateMatch.patternType,
        dateMatch.timezoneAbbr,
        dateMatch.timeRange,
        now
      ]);

      return true;
    } catch (error) {
      logger.error(`Failed to upsert event date ${eventId}:`, error);
      return false;
    }
  }

  /**
   * Print date extraction statistics
   */
  protected printDateStats(label: string, stats: ProcessingStats): void {
    if (!stats) {
      return;
    }

    logger.info(`\n📊 ${label}:`);
    logger.info(`   Event dates extracted: ${stats.totalDates}`);
    logger.info(`   Events with dates: ${stats.totalDates}/${stats.totalEvents} (${stats.coveragePercent}%)`);

    if (stats.confidenceDistribution?.length > 0) {
      logger.info(`\n   Confidence distribution:`);
      for (const dist of stats.confidenceDistribution) {
        logger.info(`     • ${dist.confidenceLevel}: ${dist.count} dates`);
      }
    }

    if (stats.sampleDates?.length > 0) {
      logger.info(`\n   Sample extracted dates:`);
      for (const dateInfo of stats.sampleDates.slice(0, 5)) {
        logger.info(`     • ${dateInfo.eventId}: ${dateInfo.eventTimeUtc} (confidence: ${dateInfo.confidence.toFixed(2)})`);
      }
    }
  }

  /**
   * Process events in test mode (sample events)
   */
  abstract processTestMode(): Promise<void>;

  /**
   * Process all events in batches
   */
  abstract processFullMode(batchSize: number): Promise<void>;
}