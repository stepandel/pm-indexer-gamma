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
src/
├── index.ts           # Main entry point
├── config/
│   └── config.ts      # Configuration management
├── lib/
│   ├── indexer.ts     # Core indexer logic
│   ├── polymarket-client.ts  # API client
│   └── logger.ts      # Logging utility
└── types/
    └── market.ts      # TypeScript type definitions
```

## License

MIT
