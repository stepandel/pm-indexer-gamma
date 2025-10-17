/**
 * Base platform interface that all platforms must implement
 */

export interface PlatformConfig {
  apiUrl: string;
  schema: string;
}

export interface PlatformMarket {
  id: string;
  [key: string]: any; // Allow platform-specific fields
}

export interface PlatformEvent {
  id: string;
  [key: string]: any; // Allow platform-specific fields
}

export interface PlatformTag {
  id: string;
  label: string;
  slug: string;
  [key: string]: any; // Allow platform-specific fields
}

export interface IndexerResult {
  success: boolean;
  error?: string;
  markets?: PlatformMarket[];
  events?: PlatformEvent[];
  timestamp: number;
}

export interface PlatformClient {
  testConnection(): Promise<boolean>;
  getActiveMarkets(): Promise<any>;
  getActiveEvents(): Promise<any>;
  getEvents(params?: any): Promise<any>;
}

export interface PlatformIndexer {
  run(): Promise<IndexerResult>;
  testConnection(): Promise<boolean>;
}

export interface PlatformDatabaseOperations {
  upsertMarket(marketData: any): Promise<any>;
  upsertEvent(eventData: any): Promise<any>;
  upsertTag(tagData: any): Promise<any>;
  linkEventToTag(eventId: string, tagId: string): Promise<void>;
  linkMarketToTag(marketId: string, tagId: string): Promise<void>;
  saveEventWithMarkets(event: any): Promise<any>;
}

export abstract class BasePlatform {
  constructor(
    protected config: PlatformConfig,
    protected client: PlatformClient,
    protected dbOps: PlatformDatabaseOperations
  ) {}

  abstract getName(): string;
  abstract getIndexer(): PlatformIndexer;
}