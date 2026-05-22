# REFDATA-SERVICE

## Overview

REFDATA-SERVICE is responsible for managing canonical financial reference data across the FinBoard platform.

The service acts as the source of truth for:

- instruments,
- exchanges,
- listings,
- trading venues,
- calendars,
- FX metadata.

All other services depend on REFDATA-SERVICE for normalized identifiers and market metadata.

---

# Responsibilities

REFDATA-SERVICE is responsible for:

- instrument metadata,
- exchange metadata,
- venue normalization,
- listing relationships,
- trading calendar information,
- FX reference data.

The service does NOT:

- store historical prices,
- manage portfolios,
- evaluate alerts,
- process authentication.

---

# Owned Schema

The service owns the `refdata` schema.

## Main Tables

| Table | Purpose |
|---|---|
| `refdata.instruments` | Financial instruments |
| `refdata.venues` | Exchanges and venues |
| `refdata.listings` | Instrument listings |
| `refdata.calendars` | Trading calendars |
| `refdata.fx_rates_daily` | FX reference rates |

---

# Architectural Importance

REFDATA-SERVICE provides normalized identifiers used across the platform.

This avoids:

- duplicated symbol logic,
- inconsistent instrument naming,
- exchange ambiguity,
- conflicting identifiers.

---

# Instrument Model

An instrument represents a tradable financial entity.

Examples:

- equities,
- ETFs,
- indices,
- forex pairs,
- cryptocurrencies.

---

# Listing Model

Listings connect instruments to trading venues.

Example:

| Instrument | Venue |
|---|---|
| AAPL | NASDAQ |
| BMW | XETRA |

This separation supports multi-listing scenarios.

---

# Service Dependencies

## Used By

| Service | Purpose |
|---|---|
| MARKETDATA-SERVICE | Instrument normalization |
| PORTFOLIO-SERVICE | Position metadata |
| WATCHLIST-SERVICE | Symbol references |
| ALERTS-SERVICE | Instrument lookup |

---

# Future Improvements

Planned improvements include:

- corporate actions,
- dividend tracking,
- split handling,
- timezone normalization,
- advanced market calendars.

---

# Summary

REFDATA-SERVICE acts as the canonical metadata layer of FinBoard.

The service centralizes instrument and exchange information while preserving clean ownership boundaries and future scalability.
