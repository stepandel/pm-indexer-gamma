import dotenv from 'dotenv';

dotenv.config();

export const config = {
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