export type { DateMatch } from '@prediction-markets/shared';

export interface ProcessingResult {
  processed: number;
  datesFound: number;
  eventsUpdated: number;
  errors: number;
}

export interface ProcessingStats {
  totalDates: number;
  totalEvents: number;
  coveragePercent: number;
  confidenceDistribution: Array<{
    confidenceLevel: string;
    count: number;
  }>;
  sampleDates: Array<{
    eventId: string;
    eventTimeUtc: Date;
    confidence: number;
  }>;
}