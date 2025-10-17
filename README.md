# Polymarket Indexer

A TypeScript-based indexer for Polymarket that runs as a cron job on Railway, fetching and processing market data every 5 minutes.

## Features

- Fetches active markets and events from Polymarket API
- Tracks recently updated markets
- Configurable via environment variables
- Built with Bun for fast runtime performance
- Ready for Railway deployment with cron scheduling

## Installation

```bash
bun install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Available environment variables:
- `POLYMARKET_API_URL` - Polymarket API endpoint (default: https://gamma-api.polymarket.com)
- `DATABASE_URL` - Database connection string (optional)
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `CRON_SCHEDULE` - Cron schedule for local testing

## Development

Run the indexer locally:

```bash
bun run src/index.ts
```

## Deployment to Railway

1. Push to your GitHub repository
2. Connect the repository to Railway
3. Railway will automatically detect the configuration and deploy

The indexer will run every 5 minutes as configured in `railway.json`.

## Project Structure

```
├── prisma/
│   └── schema.prisma              # Database schema
├── src/
│   ├── index.ts                   # Main entry point
│   ├── config/
│   │   └── config.ts              # Configuration management
│   ├── lib/
│   │   ├── database.ts            # Database connection and utilities
│   │   ├── http-client.ts         # Generic HTTP client
│   │   └── logger.ts              # Logging utility
│   └── platforms/                 # Multi-platform support
│       ├── platform-registry.ts   # Platform registry and management
│       ├── base/
│       │   ├── base-indexer.ts    # Base indexer class
│       │   └── platform-interface.ts  # Platform interface definition
│       ├── kalshi/
│       │   ├── index.ts           # Kalshi platform entry
│       │   ├── client.ts          # Kalshi API client
│       │   ├── indexer.ts         # Kalshi indexer implementation
│       │   ├── operations.ts      # Kalshi operations
│       │   └── types.ts           # Kalshi type definitions
│       └── polymarket/
│           ├── index.ts           # Polymarket platform entry
│           ├── client.ts          # Polymarket API client
│           ├── indexer.ts         # Polymarket indexer implementation
│           ├── operations.ts      # Polymarket operations
│           └── types.ts           # Polymarket type definitions
├── package.json                   # Dependencies and scripts
├── railway.json                   # Railway deployment configuration
└── tsconfig.json                  # TypeScript configuration
```

## License

MIT
