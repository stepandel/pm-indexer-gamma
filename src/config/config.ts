import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Platform selection - which platform to run
  platform: process.env.PLATFORM as 'polymarket' | 'kalshi' | undefined,

  // Platform-specific configurations
  platforms: {
    polymarket: {
      apiUrl: process.env.POLYMARKET_API_URL || 'https://gamma-api.polymarket.com',
      schema: 'polymarket',
      enabled: process.env.POLYMARKET_ENABLED !== 'false', // enabled by default
    },
    kalshi: {
      apiUrl: process.env.KALSHI_API_URL || 'https://api.kalshi.com',
      schema: 'kalshi',
      enabled: process.env.KALSHI_ENABLED === 'true', // disabled by default
    },
  },

  // Legacy polymarket config for backward compatibility
  polymarket: {
    apiUrl: process.env.POLYMARKET_API_URL || 'https://gamma-api.polymarket.com',
  },

  database: {
    url: process.env.DATABASE_URL || '',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  cron: {
    schedule: process.env.CRON_SCHEDULE || '*/5 * * * *',
  },
} as const;

// Validation
if (config.platform && !config.platforms[config.platform]) {
  throw new Error(`Invalid platform: ${config.platform}. Available platforms: ${Object.keys(config.platforms).join(', ')}`);
}

// Default to polymarket if no platform specified
export const selectedPlatform = config.platform || 'polymarket';
export const selectedPlatformConfig = config.platforms[selectedPlatform];