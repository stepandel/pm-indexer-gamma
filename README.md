# Prediction Markets Monorepo

A TypeScript monorepo for prediction market data processing and analysis. Built with modern tools (pnpm + Turborepo) for scalable multi-platform indexing and future expansion.

## Features

- **🏗️ Monorepo Architecture**: Turborepo + pnpm for optimal developer experience
- **🚀 Multi-platform Indexing**: Index data from Polymarket and Kalshi
- **📦 Shared Libraries**: Reusable platform abstractions and utilities
- **🔄 Database Isolation**: Each platform uses its own database schema
- **⚡ Fast Builds**: Turborepo caching and parallel execution
- **🚆 Railway-ready**: Independent deployments per app/platform

## Prerequisites

- **Node.js** 18+
- **pnpm** 8+ (install with `npm install -g pnpm`)

## Installation

```bash
pnpm install
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

### Database Setup

Start the development database:
```bash
pnpm db:setup
```

Run migrations:
```bash
pnpm db:migrate:deploy
```

### Building & Running

Build all packages:
```bash
pnpm build
```

Run type checking:
```bash
pnpm typecheck
```

### Run Apps Locally

Run Polymarket indexer:
```bash
PLATFORM=polymarket pnpm --filter @prediction-markets/indexer start
```

Run Kalshi indexer:
```bash
PLATFORM=kalshi pnpm --filter @prediction-markets/indexer start
```

Development mode (with file watching):
```bash
pnpm --filter @prediction-markets/indexer dev
```

## Railway Deployment

The monorepo supports deploying each app independently to Railway. Each app has its own `railway.json` configuration.

### Indexer App Deployment

Deploy **separate Railway services** for each platform from the same repository:

#### Polymarket Indexer Service
1. Create a new Railway service
2. Connect to your GitHub repository
3. Set Railway configuration to use `apps/indexer/railway.json`
4. Set environment variables:
   ```
   PLATFORM=polymarket
   DATABASE_URL=<your-database-url>
   POLYMARKET_API_URL=https://gamma-api.polymarket.com (optional)
   LOG_LEVEL=info (optional)
   ```

#### Kalshi Indexer Service
1. Create another Railway service
2. Connect to the same GitHub repository
3. Set Railway configuration to use `apps/indexer/railway.json`
4. Set environment variables:
   ```
   PLATFORM=kalshi
   DATABASE_URL=<same-database-url>
   KALSHI_API_URL=https://api.elections.kalshi.com (optional)
   LOG_LEVEL=info (optional)
   ```

### Railway Command
The indexer uses this start command in Railway:
```
pnpm --filter @prediction-markets/indexer start
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

## Monorepo Structure

```
prediction-markets-monorepo/
├── apps/                          # Deployable applications
│   └── indexer/                   # Multi-platform indexer app
│       ├── src/
│       │   └── index.ts           # Entry point with platform selection
│       ├── package.json           # App-specific dependencies
│       ├── railway.json           # Railway deployment config
│       └── tsconfig.json          # App-specific TypeScript config
│
├── packages/                      # Shared libraries
│   ├── shared/                    # Core shared utilities and platform code
│   │   ├── src/
│   │   │   ├── lib/               # Shared utilities
│   │   │   │   ├── database.ts    # Database connection
│   │   │   │   ├── http-client.ts # HTTP utilities
│   │   │   │   └── logger.ts      # Logging
│   │   │   ├── platforms/         # Platform abstractions
│   │   │   │   ├── base/          # Base interfaces and classes
│   │   │   │   ├── polymarket/    # Polymarket implementation
│   │   │   │   ├── kalshi/        # Kalshi implementation
│   │   │   │   └── platform-registry.ts
│   │   │   ├── config/            # Configuration management
│   │   │   └── index.ts           # Barrel exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── tsconfig/                  # Shared TypeScript configurations
│       ├── base.json              # Base TypeScript config
│       ├── node.json              # Node.js specific config
│       └── package.json
│
├── prisma/                        # Database (shared across all apps)
│   ├── migrations/                # Database migrations
│   └── schema.prisma             # Multi-platform schema
│
├── package.json                   # Root package.json (workspace config)
├── pnpm-workspace.yaml           # pnpm workspace configuration
├── turbo.json                     # Turborepo configuration
├── docker-compose.yml            # Local development database
└── tsconfig.json                  # Root TypeScript config
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
