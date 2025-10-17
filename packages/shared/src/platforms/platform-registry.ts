import type { BasePlatform } from './base/platform-interface';

export class PlatformRegistry {
  private platforms = new Map<string, () => Promise<BasePlatform>>();

  register(name: string, factory: () => Promise<BasePlatform>) {
    this.platforms.set(name, factory);
  }

  async get(name: string): Promise<BasePlatform> {
    const factory = this.platforms.get(name);
    if (!factory) {
      throw new Error(`Platform '${name}' not found. Available platforms: ${Array.from(this.platforms.keys()).join(', ')}`);
    }
    return factory();
  }

  getAvailable(): string[] {
    return Array.from(this.platforms.keys());
  }
}

// Global registry instance
export const platformRegistry = new PlatformRegistry();

// Auto-register platforms
export async function registerPlatforms() {
  // Polymarket platform
  platformRegistry.register('polymarket', async () => {
    const { PolymarketPlatform } = await import('./polymarket');
    return new PolymarketPlatform();
  });

  // Kalshi platform (placeholder for future implementation)
  platformRegistry.register('kalshi', async () => {
    const { KalshiPlatform } = await import('./kalshi');
    return new KalshiPlatform();
  });
}