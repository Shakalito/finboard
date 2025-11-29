-- =============================================================================
-- Financial Trading Dashboard - Database Schema
-- Version: 1.0.0
-- =============================================================================

-- UUID generator
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

------------------------------------------------------------
-- TYPY ENUM
------------------------------------------------------------
CREATE TYPE instrument_type AS ENUM (
    'EQUITY',
    'ETF',
    'CRYPTO',
    'CFD',
    'FUTURE',
    'FOREX',
    'INDEX'
);

CREATE TYPE timeframe AS ENUM (
    'm1',
    'm5',
    'm15',
    'h1',
    'h4',
    'd1',
    'w1',
    'mo1'
);

------------------------------------------------------------
-- SCHEMATY (mikroserwisy)
------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS refdata;
CREATE SCHEMA IF NOT EXISTS marketdata;
CREATE SCHEMA IF NOT EXISTS portfolio;
CREATE SCHEMA IF NOT EXISTS watchlist;
CREATE SCHEMA IF NOT EXISTS alerts;
CREATE SCHEMA IF NOT EXISTS backtest;

------------------------------------------------------------
-- AUTH-SERVICE (schema: auth)
------------------------------------------------------------

CREATE TABLE auth.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    birth_date      DATE,
    gender          VARCHAR(10),
    email           VARCHAR(255) NOT NULL,
    password_hash   TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified     BOOLEAN NOT NULL DEFAULT TRUE,
    twofa_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    twofa_secret    VARCHAR(64),
    timezone        VARCHAR(50) NOT NULL DEFAULT 'Europe/Warsaw',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

-- Unikalność po LOWER(email)
CREATE UNIQUE INDEX users_email_lower_uniq ON auth.users (LOWER(email));

CREATE TABLE auth.user_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    refresh_token_hash  TEXT NOT NULL,
    user_agent          TEXT,
    ip                  VARCHAR(64),
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_user_sessions_user
        FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

------------------------------------------------------------
-- REFDATA-SERVICE (schema: refdata)
------------------------------------------------------------

CREATE TABLE refdata.instruments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type                instrument_type NOT NULL,
    name                VARCHAR(255) NOT NULL,
    base_currency       VARCHAR(10) NOT NULL,
    tick_size           NUMERIC(18,8),
    lot_size            NUMERIC(18,8),
    leverage_max        NUMERIC(18,6),
    contract_multiplier NUMERIC(18,6),
    underlying_id       UUID,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_instruments_underlying
        FOREIGN KEY (underlying_id) REFERENCES refdata.instruments(id)
);

CREATE TABLE refdata.venues (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    timezone    VARCHAR(50) NOT NULL,
    country     VARCHAR(50),
    mic         VARCHAR(10),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT venues_code_unique UNIQUE (code)
);

CREATE TABLE refdata.listings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id   UUID NOT NULL,
    venue_id        UUID NOT NULL,
    ticker          VARCHAR(50),
    isin            VARCHAR(20),
    currency        VARCHAR(10),
    quote_currency  VARCHAR(10),
    market_code     VARCHAR(50),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_listings_instrument
        FOREIGN KEY (instrument_id) REFERENCES refdata.instruments(id),
    CONSTRAINT fk_listings_venue
        FOREIGN KEY (venue_id) REFERENCES refdata.venues(id),
    CONSTRAINT listings_instrument_venue_unique
        UNIQUE (instrument_id, venue_id)
);

CREATE INDEX listings_ticker_idx ON refdata.listings (ticker);
CREATE INDEX listings_market_code_idx ON refdata.listings (market_code);

CREATE TABLE refdata.calendars (
    venue_id        UUID NOT NULL,
    date            DATE NOT NULL,
    is_open         BOOLEAN NOT NULL DEFAULT FALSE,
    session_open    TIME,
    session_close   TIME,
    CONSTRAINT calendars_pk PRIMARY KEY (venue_id, date),
    CONSTRAINT fk_calendars_venue
        FOREIGN KEY (venue_id) REFERENCES refdata.venues(id)
);

CREATE TABLE refdata.fx_rates_daily (
    date    DATE NOT NULL,
    base    VARCHAR(10) NOT NULL,
    quote   VARCHAR(10) NOT NULL,
    rate    NUMERIC(18,8) NOT NULL,
    CONSTRAINT fx_rates_daily_pk PRIMARY KEY (date, base, quote)
);

CREATE TABLE refdata.corporate_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id   UUID NOT NULL,
    ex_date         DATE NOT NULL,
    type            VARCHAR(20) NOT NULL, -- DIVIDEND, SPLIT, SYMBOL_CHANGE
    ratio           NUMERIC(18,8),
    amount          NUMERIC(18,8),
    CONSTRAINT fk_corp_actions_instrument
        FOREIGN KEY (instrument_id) REFERENCES refdata.instruments(id)
);

------------------------------------------------------------
-- MARKETDATA-SERVICE (schema: marketdata)
------------------------------------------------------------
CREATE TABLE marketdata.ohlcv (
    instrument_id   UUID NOT NULL,
    venue_id        UUID NOT NULL, -- Currently single venue, expandable to multi-venue
    tf              timeframe NOT NULL,
    ts              TIMESTAMPTZ NOT NULL, -- UTC
    open            NUMERIC(18,8) NOT NULL,
    high            NUMERIC(18,8) NOT NULL,
    low             NUMERIC(18,8) NOT NULL,
    close           NUMERIC(18,8) NOT NULL,
    volume          NUMERIC(28,8),
    CONSTRAINT ohlcv_pk PRIMARY KEY (instrument_id, venue_id, tf, ts),
    CONSTRAINT fk_ohlcv_instrument
        FOREIGN KEY (instrument_id) REFERENCES refdata.instruments(id),
    CONSTRAINT fk_ohlcv_venue
        FOREIGN KEY (venue_id) REFERENCES refdata.venues(id)
);

CREATE TABLE marketdata.quotes_latest (
    instrument_id   UUID PRIMARY KEY,
    venue_id        UUID,
    price           NUMERIC(18,8) NOT NULL,
    ts              TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_quotes_latest_instrument
        FOREIGN KEY (instrument_id) REFERENCES refdata.instruments(id),
    CONSTRAINT fk_quotes_latest_venue
        FOREIGN KEY (venue_id) REFERENCES refdata.venues(id)
);

CREATE TABLE marketdata.news_articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source          VARCHAR(100) NOT NULL,
    title           TEXT NOT NULL,
    url             TEXT NOT NULL,
    lang            VARCHAR(10),
    published_at    TIMESTAMPTZ NOT NULL,
    raw_text        TEXT,
    instrument_id   UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_news_articles_instrument
        FOREIGN KEY (instrument_id) REFERENCES refdata.instruments(id)
);

CREATE TABLE marketdata.news_sentiment (
    article_id      UUID PRIMARY KEY,
    model           VARCHAR(50) NOT NULL,
    sentiment_score NUMERIC(18,8) NOT NULL,
    confidence      NUMERIC(18,8),
    CONSTRAINT fk_news_sentiment_article
        FOREIGN KEY (article_id) REFERENCES marketdata.news_articles(id)
);

------------------------------------------------------------
-- PORTFOLIO-SERVICE (schema: portfolio)
------------------------------------------------------------

CREATE TABLE portfolio.accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    base_currency   VARCHAR(10) NOT NULL DEFAULT 'USD',
    type            VARCHAR(20) NOT NULL DEFAULT 'PAPER',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_accounts_user
        FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE portfolio.account_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL,
    ts              TIMESTAMPTZ NOT NULL DEFAULT now(),
    currency        VARCHAR(10) NOT NULL,
    amount          NUMERIC(18,8) NOT NULL,
    type            VARCHAR(30) NOT NULL, -- DEPOSIT, WITHDRAWAL, ...
    ref_id          UUID,
    CONSTRAINT fk_account_entries_account
        FOREIGN KEY (account_id) REFERENCES portfolio.accounts(id)
);

CREATE INDEX account_entries_account_ts_idx
    ON portfolio.account_entries (account_id, ts);

CREATE TABLE portfolio.positions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL,
    instrument_id   UUID NOT NULL,
    quantity        NUMERIC(28,10) NOT NULL DEFAULT 0,
    avg_price       NUMERIC(18,8) NOT NULL DEFAULT 0,
    CONSTRAINT positions_account_instrument_unique
        UNIQUE (account_id, instrument_id),
    CONSTRAINT fk_positions_account
        FOREIGN KEY (account_id) REFERENCES portfolio.accounts(id),
    CONSTRAINT fk_positions_instrument
        FOREIGN KEY (instrument_id) REFERENCES refdata.instruments(id)
);

CREATE TABLE portfolio.orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL,
    instrument_id   UUID NOT NULL,
    side            VARCHAR(4) NOT NULL,      -- BUY/SELL
    type            VARCHAR(10) NOT NULL DEFAULT 'MARKET', -- MARKET/LIMIT
    qty             NUMERIC(28,10) NOT NULL,
    limit_price     NUMERIC(18,8),
    state           VARCHAR(12) NOT NULL DEFAULT 'NEW',   -- NEW/FILLED/...
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_orders_account
        FOREIGN KEY (account_id) REFERENCES portfolio.accounts(id),
    CONSTRAINT fk_orders_instrument
        FOREIGN KEY (instrument_id) REFERENCES refdata.instruments(id)
);

CREATE TABLE portfolio.executions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL,
    price           NUMERIC(18,8) NOT NULL,
    qty             NUMERIC(28,10) NOT NULL,
    fee             NUMERIC(18,8) NOT NULL DEFAULT 0,
    fee_currency    VARCHAR(10),
    executed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_executions_order
        FOREIGN KEY (order_id) REFERENCES portfolio.orders(id)
);

------------------------------------------------------------
-- WATCHLIST-SERVICE (schema: watchlist)
------------------------------------------------------------

CREATE TABLE watchlist.watchlists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    instrument_id   UUID NOT NULL,
    venue_id        UUID,
    label           VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT watchlists_user_instrument_venue_unique
        UNIQUE (user_id, instrument_id, venue_id),
    CONSTRAINT fk_watchlists_user
        FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT fk_watchlists_instrument
        FOREIGN KEY (instrument_id) REFERENCES refdata.instruments(id),
    CONSTRAINT fk_watchlists_venue
        FOREIGN KEY (venue_id) REFERENCES refdata.venues(id)
);

------------------------------------------------------------
-- ALERTS-SERVICE (schema: alerts)
------------------------------------------------------------

CREATE TABLE alerts.alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    instrument_id   UUID NOT NULL,
    venue_id        UUID,
    condition_type  VARCHAR(20) NOT NULL,  -- ABOVE, BELOW, ...
    target_value    NUMERIC(18,8) NOT NULL,
    timeframe       timeframe NOT NULL DEFAULT 'd1',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    cooldown_s      INTEGER NOT NULL DEFAULT 0,
    triggered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ,
    CONSTRAINT fk_alerts_user
        FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT fk_alerts_instrument
        FOREIGN KEY (instrument_id) REFERENCES refdata.instruments(id),
    CONSTRAINT fk_alerts_venue
        FOREIGN KEY (venue_id) REFERENCES refdata.venues(id)
);

CREATE INDEX alerts_user_instrument_idx
    ON alerts.alerts (user_id, instrument_id);

------------------------------------------------------------
-- BACKTEST-SERVICE (schema: backtest)
------------------------------------------------------------

CREATE TABLE backtest.strategies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    version         VARCHAR(50) NOT NULL,
    code_ref        VARCHAR(200),
    params_schema   JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT strategies_name_version_unique
        UNIQUE (name, version)
);

CREATE TABLE backtest.datasets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description     TEXT,
    built_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_tags     JSONB
);

CREATE TABLE backtest.backtests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    strategy_id         UUID NOT NULL,
    dataset_id          UUID,
    universe            JSONB,
    timeframe           timeframe NOT NULL DEFAULT 'd1',
    date_from           TIMESTAMPTZ NOT NULL,
    date_to             TIMESTAMPTZ NOT NULL,
    params              JSONB NOT NULL,
    initial_cash        NUMERIC(18,2) NOT NULL,
    commission_model    JSONB,
    slippage_model      JSONB,
    seed                INTEGER,
    state               VARCHAR(10) NOT NULL DEFAULT 'queued',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at         TIMESTAMPTZ,
    notes               TEXT,
    CONSTRAINT fk_backtests_user
        FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT fk_backtests_strategy
        FOREIGN KEY (strategy_id) REFERENCES backtest.strategies(id),
    CONSTRAINT fk_backtests_dataset
        FOREIGN KEY (dataset_id) REFERENCES backtest.datasets(id)
);

CREATE TABLE backtest.backtest_equity (
    backtest_id     UUID NOT NULL,
    ts              TIMESTAMPTZ NOT NULL,
    equity          NUMERIC(18,8) NOT NULL,
    daily_ret       NUMERIC(18,8),
    CONSTRAINT backtest_equity_pk PRIMARY KEY (backtest_id, ts),
    CONSTRAINT fk_backtest_equity_backtest
        FOREIGN KEY (backtest_id) REFERENCES backtest.backtests(id)
);

CREATE TABLE backtest.backtest_trades (
    id              BIGSERIAL PRIMARY KEY,
    backtest_id     UUID NOT NULL,
    instrument_id   UUID NOT NULL,
    entry_ts        TIMESTAMPTZ NOT NULL,
    entry_price     NUMERIC(18,8) NOT NULL,
    exit_ts         TIMESTAMPTZ NOT NULL,
    exit_price      NUMERIC(18,8) NOT NULL,
    qty             NUMERIC(28,10) NOT NULL,
    side            VARCHAR(4) NOT NULL, -- BUY/SELL
    fees_entry      NUMERIC(18,8) NOT NULL DEFAULT 0,
    fees_exit       NUMERIC(18,8) NOT NULL DEFAULT 0,
    pnl_abs         NUMERIC(18,8) NOT NULL,
    pnl_pct         NUMERIC(18,8) NOT NULL,
    CONSTRAINT fk_backtest_trades_backtest
        FOREIGN KEY (backtest_id) REFERENCES backtest.backtests(id),
    CONSTRAINT fk_backtest_trades_instrument
        FOREIGN KEY (instrument_id) REFERENCES refdata.instruments(id)
);

CREATE TABLE backtest.backtest_metrics (
    backtest_id     UUID PRIMARY KEY,
    cagr            NUMERIC(18,8),
    sharpe          NUMERIC(18,8),
    sortino         NUMERIC(18,8),
    calmar          NUMERIC(18,8),
    volatility      NUMERIC(18,8),
    max_drawdown    NUMERIC(18,8),
    mdd_duration    INTEGER,
    win_rate        NUMERIC(18,8),
    n_trades        INTEGER,
    bh_return       NUMERIC(18,8),
    turnover        NUMERIC(18,8),
    avg_trade       NUMERIC(18,8),
    exposure        NUMERIC(18,8),
    CONSTRAINT fk_backtest_metrics_backtest
        FOREIGN KEY (backtest_id) REFERENCES backtest.backtests(id)
);
