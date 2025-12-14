-- =============================================================================
-- SEED: refdata (venues, instruments, listings)
-- Minimum set of 10 companies for UI testing.
-- Idempotent: running multiple times does not duplicate (after ticker + venue).
-- =============================================================================

-- 1) Venue (e.g. "NASDAQ" as one stock exchange for the project)
WITH v AS (
  INSERT INTO refdata.venues (code, name, timezone, country, mic)
  VALUES ('NASDAQ', 'NASDAQ Stock Market', 'America/New_York', 'US', 'XNAS')
  ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      timezone = EXCLUDED.timezone,
      country = EXCLUDED.country,
      mic = EXCLUDED.mic,
      updated_at = now()
  RETURNING id
),

-- 2) List of tickers for seeding
tickers AS (
  SELECT * FROM (VALUES
    ('AAPL', 'Apple Inc.', 'USD'),
    ('MSFT', 'Microsoft Corp.', 'USD'),
    ('GOOGL', 'Alphabet Inc. (Class A)', 'USD'),
    ('AMZN', 'Amazon.com Inc.', 'USD'),
    ('NVDA', 'NVIDIA Corp.', 'USD'),
    ('TSLA', 'Tesla Inc.', 'USD'),
    ('META', 'Meta Platforms Inc.', 'USD'),
    ('JPM', 'JPMorgan Chase & Co.', 'USD'),
    ('JNJ', 'Johnson & Johnson', 'USD'),
    ('V', 'Visa Inc.', 'USD')
  ) AS t(ticker, name, currency)
),

-- 3) Insert instruments (one instrument per ticker)
ins AS (
  INSERT INTO refdata.instruments (type, name, base_currency, active)
  SELECT 'EQUITY', t.name, t.currency, true
  FROM tickers t
  WHERE NOT EXISTS (
    SELECT 1
    FROM refdata.instruments i
    WHERE i.type = 'EQUITY' AND i.name = t.name AND i.base_currency = t.currency
  )
  RETURNING id, name, base_currency
)

-- 4) Insert listings (uniqueness is provided by (instrument_id, venue_id), but we seed by ticker:
INSERT INTO refdata.listings (instrument_id, venue_id, ticker, currency, active)
SELECT i.id, v.id, t.ticker, t.currency, true
FROM tickers t
CROSS JOIN v
JOIN refdata.instruments i
  ON i.type = 'EQUITY' AND i.name = t.name AND i.base_currency = t.currency
WHERE NOT EXISTS (
  SELECT 1
  FROM refdata.listings l
  WHERE l.venue_id = v.id AND l.ticker = t.ticker
);
