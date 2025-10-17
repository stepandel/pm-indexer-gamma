import type { PlatformClient } from '../base/platform-interface';
import { createPolymarketClient } from '../../lib/polymarket-client';

export class PolymarketClient implements PlatformClient {
  private client: ReturnType<typeof createPolymarketClient>;

  constructor() {
    this.client = createPolymarketClient();
  }

  async testConnection(): Promise<boolean> {
    try {
      const events = await this.client.getEvents({ limit: 1 });
      return events && events.length >= 0; // Even 0 events is a successful connection
    } catch (error) {
      return false;
    }
  }

  async getActiveMarkets(): Promise<any> {
    return this.client.getActiveMarkets();
  }

  async getActiveEvents(): Promise<any> {
    return this.client.getActiveEvents();
  }

  async getEvents(params?: any): Promise<any> {
    return this.client.getEvents(params);
  }
}