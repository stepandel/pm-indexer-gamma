# Multi-Platform Prediction Market Indexer

A TypeScript-based indexer that supports multiple prediction market platforms (Polymarket and Kalshi) and runs as a cron job on Railway, fetching and processing market data every 5 minutes.

## Features

- **Multi-platform support**: Index data from Polymarket and Kalshi
- **Platform isolation**: Each platform uses its own database schema
- **Configurable deployments**: Deploy separate instances for each platform
- **Built with Bun** for fast runtime performance
- **Railway-ready** with cron scheduling and environment-based deployment

## Installation

```bash
bun install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Environment Variables

**Platform Selection** (required):
- `PLATFORM` - Which platform to index (`polymarket` or `kalshi`)

**API Configuration**:
- `POLYMARKET_API_URL` - Polymarket API endpoint (default: `https://gamma-api.polymarket.com`)
- `KALSHI_API_URL` - Kalshi API endpoint (default: `https://api.elections.kalshi.com`)

**Database & Infrastructure**:
- `DATABASE_URL` - PostgreSQL connection string (required)
- `LOG_LEVEL` - Logging level (`debug`, `info`, `warn`, `error`)
- `CRON_SCHEDULE` - Cron schedule for local testing (default: `*/5 * * * *`)

## Development

### Run Locally

Run Polymarket indexer:
```bash
PLATFORM=polymarket bun run src/index.ts
```

Run Kalshi indexer:
```bash
PLATFORM=kalshi bun run src/index.ts
```

### Database Setup

Start the development database:
```bash
bun run db:setup
```

Run migrations:
```bash
bun run db:migrate:deploy
```

## Railway Deployment

This project supports deploying separate Railway services for each platform, sharing the same database but running independently.

### Option 1: Separate Railway Services (Recommended)

Deploy **two separate Railway services** from the same repository:

#### Polymarket Service
1. Create a new Railway service
2. Connect to your GitHub repository
3. Set environment variables:
   ```
   PLATFORM=polymarket
   DATABASE_URL=<your-database-url>
   POLYMARKET_API_URL=https://gamma-api.polymarket.com (optional)
   LOG_LEVEL=info (optional)
   ```

#### Kalshi Service
1. Create another Railway service
2. Connect to the same GitHub repository
3. Set environment variables:
   ```
   PLATFORM=kalshi
   DATABASE_URL=<same-database-url>
   KALSHI_API_URL=https://api.elections.kalshi.com (optional)
   LOG_LEVEL=info (optional)
   ```

### Option 2: Single Service with Manual Platform Switch

Deploy one service and manually change the `PLATFORM` environment variable when you want to switch platforms.

### Database Schema

Both platforms use the same PostgreSQL database with separate schemas:
- **Polymarket data**: `polymarket` schema (tables: `markets`, `market_events`, `tags`, etc.)
- **Kalshi data**: `kalshi` schema (tables: `events`, `markets`)

### Benefits of Multi-Service Deployment

- **Independent scaling**: Scale each platform service separately based on data volume
- **Isolated failures**: If one platform fails, the other continues running
- **Independent schedules**: Run different cron schedules for each platform
- **Resource optimization**: Allocate different resources per platform

## Project Structure

```
├── prisma/
│   ├── migrations/                # Database migrations
│   └── schema.prisma             # Multi-platform database schema
├── src/
│   ├── index.ts                  # Main entry point with platform selection
│   ├── config/
│   │   └── config.ts             # Multi-platform configuration
│   ├── lib/
│   │   ├── database.ts           # Database connection and utilities
│   │   ├── http-client.ts        # Generalized HTTP client
│   │   └── logger.ts             # Logging utility
│   └── platforms/                # Multi-platform architecture
│       ├── platform-registry.ts  # Platform registry and management
│       ├── base/
│       │   ├── base-indexer.ts   # Base indexer class
│       │   └── platform-interface.ts # Platform interface contracts
│       ├── kalshi/
│       │   ├── index.ts          # Kalshi platform implementation
│       │   ├── client.ts         # Kalshi API client with cursor pagination
│       │   ├── indexer.ts        # Kalshi indexer logic
│       │   ├── operations.ts     # Kalshi database operations
│       │   └── types.ts          # Kalshi type definitions
│       └── polymarket/
│           ├── index.ts          # Polymarket platform implementation
│           ├── client.ts         # Polymarket API client
│           ├── indexer.ts        # Polymarket indexer logic
│           ├── operations.ts     # Polymarket database operations
│           └── types.ts          # Polymarket type definitions
├── package.json                  # Dependencies and scripts
├── railway.json                  # Railway deployment configuration
└── tsconfig.json                 # TypeScript configuration
```

## Database Schemas

### Polymarket Schema (`polymarket.*`)
- `markets` - Market data with pricing and metadata
- `market_events` - Event data with descriptions and properties
- `tags` - Categorization tags
- `market_tags` - Market-to-tag relationships
- `market_event_tags` - Event-to-tag relationships

### Kalshi Schema (`kalshi.*`)
- `events` - Event data with tickers and categories
- `markets` - Market data with pricing and settlement info

## API Integration

### Polymarket
- **Base URL**: `https://gamma-api.polymarket.com`
- **Endpoints**: `/markets`, `/events`
- **Pagination**: Offset-based with batching

### Kalshi
- **Base URL**: `https://api.elections.kalshi.com`
- **Endpoints**: `/trade-api/v2/events?with_nested_markets=true`
- **Pagination**: Cursor-based with 200 items per request

## License

MIT
