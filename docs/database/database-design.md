# Database Design

## Overview

FinBoard uses PostgreSQL as the primary persistence layer.

The database architecture follows a schema-per-service model inspired by microservice database ownership principles. Each domain service owns its schema, tables and business entities.

This approach provides:

- domain isolation,
- reduced coupling,
- clear ownership boundaries,
- easier migration toward independent services,
- simplified future extraction into dedicated databases.

## Database Strategy

The current MVP deployment uses:

- one PostgreSQL instance,
- multiple service-owned schemas,
- shared infrastructure runtime,
- UUID-based identifiers.

Although services currently share the same database instance, logical ownership is explicitly separated.

## Schema Ownership

| Schema | Service | Responsibility |
|---|---|---|
| `auth` | AUTH-SERVICE | Users, sessions, authentication |
| `refdata` | REFDATA-SERVICE | Instruments, exchanges, listings |
| `marketdata` | MARKETDATA-SERVICE | OHLCV, quotes, market snapshots |
| `portfolio` | PORTFOLIO-SERVICE | Accounts, orders, positions |
| `watchlist` | WATCHLIST-SERVICE | User watchlists |
| `alerts` | ALERTS-SERVICE | User alert definitions |
| `backtest` | BACKTEST-SERVICE | Historical strategy simulations |

## Core Design Principles

### 1. Schema Ownership

Each service owns its schema and is responsible for:

- migrations,
- validation,
- business rules,
- write operations,
- data lifecycle.

Services should not directly modify another service's tables.

### 2. UUID Everywhere

All major entities use UUID identifiers.

Example:

- `users.id`
- `instrument_id`
- `order_id`
- `position_id`
- `alert_id`

Advantages:

- globally unique identifiers,
- no dependency on centralized ID generation,
- safer distributed architecture,
- easier future service extraction,
- improved replication compatibility.

### 3. No Cross-Writes

Services may reference foreign entities by ID, but should not directly write into another schema.

Correct approach:

- AUTH-SERVICE owns users,
- MARKETDATA-SERVICE owns prices,
- PORTFOLIO-SERVICE owns positions,
- ALERTS-SERVICE owns alert definitions.

### 4. Read Separation

Historical and realtime market data are separated intentionally.

| Data Type | Storage |
|---|---|
| Historical OHLCV | `marketdata.ohlcv` |
| Current quotes | `marketdata.quotes_latest` |

This enables:

- efficient chart rendering,
- simplified caching,
- independent retention strategies,
- future realtime infrastructure.

## AUTH-SERVICE Schema

### Main Tables

| Table | Purpose |
|---|---|
| `auth.users` | Global user identities |
| `auth.user_sessions` | Refresh tokens and sessions |

### Notes

- `auth.users.id` is the global user identifier.
- JWT authentication is used across the system.
- Future 2FA support is planned.

## REFDATA-SERVICE Schema

### Main Tables

| Table | Purpose |
|---|---|
| `refdata.instruments` | Financial instruments |
| `refdata.venues` | Exchanges and trading venues |
| `refdata.listings` | Instrument listings |
| `refdata.calendars` | Trading calendars |
| `refdata.fx_rates_daily` | FX conversion data |

### Notes

REFDATA-SERVICE acts as the source of truth for:

- instrument identifiers,
- venue identifiers,
- listing identifiers.

Other services should reference these entities instead of duplicating them.

## MARKETDATA-SERVICE Schema

### Main Tables

| Table | Purpose |
|---|---|
| `marketdata.ohlcv` | Historical candles |
| `marketdata.quotes_latest` | Current market snapshots |
| `marketdata.news_articles` | Financial news |
| `marketdata.news_sentiment` | Sentiment analysis |

### OHLCV Model

The OHLCV table stores:

- open,
- high,
- low,
- close,
- volume,
- timestamps,
- intervals.

Supported intervals may include:

- 1m,
- 5m,
- 1h,
- 1d,
- weekly.

### Quotes Snapshot Model

`quotes_latest` stores only the latest known market state.

This table is optimized for:

- portfolio valuation,
- alerts,
- realtime dashboards.

## PORTFOLIO-SERVICE Schema

### Main Tables

| Table | Purpose |
|---|---|
| `portfolio.accounts` | User portfolio accounts |
| `portfolio.account_entries` | Ledger entries |
| `portfolio.positions` | Current holdings |
| `portfolio.orders` | Orders |
| `portfolio.executions` | Executed trades |

## Financial Consistency Model

FinBoard intentionally separates:

| Entity | Responsibility |
|---|---|
| Orders | User trade intent |
| Executions | Trade history |
| Positions | Current holdings |
| Ledger Entries | Financial consistency |

### Ledger Design

`portfolio.account_entries` follows double-entry accounting concepts.

This provides:

- traceable balance history,
- consistent cash tracking,
- auditability,
- easier reconciliation.

## WATCHLIST-SERVICE Schema

### Main Tables

| Table | Purpose |
|---|---|
| `watchlist.watchlists` | User watchlists |

### Constraints

A uniqueness constraint prevents duplicate entries:

- `(user_id, instrument_id, venue_id)`

This ensures that one instrument cannot be added multiple times for the same user and venue combination.

## ALERTS-SERVICE Schema

### Main Tables

| Table | Purpose |
|---|---|
| `alerts.alerts` | User-defined alert rules |

### Supported Alert Types

Potential alert types:

- price alerts,
- percentage movement alerts,
- volume alerts,
- SMA alerts.

### Alert Processing

ALERTS-SERVICE depends on:

- realtime quotes,
- latest market snapshots,
- periodic evaluation workers.

Historical OHLCV data is not required for simple realtime alert logic.

## BACKTEST-SERVICE Schema

### Planned Tables

| Table | Purpose |
|---|---|
| `backtest.strategies` | Strategy definitions |
| `backtest.datasets` | Dataset metadata |
| `backtest.backtests` | Backtest runs |
| `backtest.backtest_equity` | Equity curves |
| `backtest.backtest_trades` | Simulated trades |
| `backtest.backtest_metrics` | Performance metrics |

### Notes

BACKTEST-SERVICE is planned as a future extension.

The architecture already anticipates:

- historical replay,
- strategy execution,
- metrics calculation,
- trade simulation.

## Future Database Evolution

The current MVP uses shared PostgreSQL infrastructure for simplicity.

Possible future evolution paths:

### Option 1 — Shared PostgreSQL, Separate Schemas

Pros:

- simpler operations,
- easier joins,
- lower infrastructure overhead.

### Option 2 — Independent Databases Per Service

Pros:

- stronger isolation,
- independent scaling,
- improved fault isolation,
- true microservice persistence model.

## Future Improvements

Planned improvements include:

- Redis market cache,
- event-driven synchronization,
- partitioned OHLCV storage,
- TimescaleDB evaluation,
- asynchronous ingestion pipelines,
- distributed message queues.

## Summary

FinBoard uses a service-oriented PostgreSQL architecture with schema-level isolation.

The current design balances:

- development simplicity,
- architectural separation,
- future scalability,
- migration readiness.

This enables the project to operate efficiently as an MVP while preserving a clean path toward fully independent microservices.
