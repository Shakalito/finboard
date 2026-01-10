# FinBoard AI Coding Instructions

## Architecture Overview

**FinBoard** is a full-stack financial dashboard with three layers:

1. **Backend** (FastAPI/Python): Microservice-style architecture with domain-specific routers
2. **Frontend** (React/TypeScript): Vite-based SPA with page-centric structure
3. **Database** (PostgreSQL in Docker): Relational schema with reference data, user accounts, and financial data

### Backend Service Structure
- Core services: `auth_service`, `refdata_service`, `watchlist_service`, `marketdata_service`, `portfolio_service`, `alerts_service`
- Each service has: `router.py` (API endpoints), `db_models.py` (SQLAlchemy ORM), `schemas.py` (Pydantic validation)
- Shared: `common/db.py` (DB connection), `common/config.py` (environment settings)
- Entry point: `src/main.py` (FastAPI app with CORS middleware)

### Frontend Page/API Mapping
- Pages in `src/pages/` correspond to routes defined in `src/app/router.tsx`
- Each page fetches data via functions in `src/api/` (e.g., `alerts.ts`, `portfolio.ts`)
- All API calls use `apiFetch()` from `src/api/client.ts` with Bearer token auth

### Database Schema
- Reference data: venues, instruments, listings (in `refdata` schema)
- User data: accounts, authentication (in `auth` schema via SQLAlchemy)
- Financial data: OHLCV (historical), quotes (real-time from Finnhub)
- User data: portfolio orders, executions, watchlist, alerts

## Critical Workflows

### Local Development Startup
```bash
# Terminal 1: Database
docker compose up -d

# Terminal 2: Backend (from /backend)
.\.venv\Scripts\Activate
uvicorn src.main:app --reload

# Terminal 3: Frontend (from /frontend)
npm run dev
```

### Adding a New Backend Endpoint
1. Define Pydantic schema in `{service}/schemas.py` (input/output)
2. Define SQLAlchemy model in `{service}/db_models.py` if storing data
3. Add route function to `{service}/router.py` using `@router.post/get/put/delete`
4. Use `Depends(get_current_user)` for auth-protected routes
5. Use `Depends(get_db)` to get session
6. Return Pydantic schema instance (auto-serialized to JSON)

**Example pattern** (alerts_service):
```python
@router.post("", response_model=AlertRead, status_code=status.HTTP_201_CREATED)
def create_alert(
    alert: AlertCreate, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Validate listing exists
    # Create model instance
    # db.add(), db.commit(), db.refresh()
    # Return schema-validated response
```

### Adding a New Frontend Page
1. Create `src/pages/MyPage.tsx` with React component
2. Add route in `src/app/router.tsx` 
3. Create API functions in `src/api/myfeature.ts` using `apiFetch(path, method, token)`
4. Use `useAuth()` hook for token + user context
5. Follow AlertsPage.tsx styling pattern (inline CSSProperties)

## Key Conventions

### Backend
- **Error handling**: Raise `HTTPException` with status_code and detail
- **Auth**: Extract user via `get_current_user(token: str)`, validate token with `decode_access_token()`
- **DB operations**: Use SQLAlchemy 2.0 style (`.select()` statements, not legacy query API)
- **Response models**: Always validate output with Pydantic schemas before returning
- **Service boundaries**: Alert service doesn't know about portfolio; use shared refdata only

### Frontend
- **Styling**: Inline `CSSProperties` objects (no CSS files); consistent dark theme (#1e222d, #26cc62 accents)
- **State management**: React hooks (useState, useContext) - no Redux
- **API errors**: Catch in try/catch, extract `e?.message` from response detail
- **Auth flow**: Token stored in AuthContext, automatically added to all API requests
- **Date formatting**: Use `new Date(iso).toLocaleString()` for display

### Database
- **Schemas**: Multiple schemas (refdata, auth, portfolio, etc.) for domain separation
- **Enums**: Timeframe stored as PostgreSQL ENUM (m1, m5, m15, h1, h4, d1, w1, mo1)
- **Currencies**: Stored per listing; default USD if missing
- **Seeding**: Use `docker exec` + psql for SQL; Python scripts for Yahoo Finance data

## Integration Points

### External APIs
- **Finnhub**: Real-time quotes (free tier) - see `marketdata_service/external_finnhub.py`
- **Yahoo Finance**: Historical OHLCV via `yfinance` - seeded manually via `scripts/seed_yahoo_ohlcv.py`

### Cross-Service Communication
- Alerts references listings via UUID (refdata)
- Portfolio orders reference listings via UUID (refdata)
- No direct inter-service DB calls - all via REST API or shared reference data

### Authentication
- JWT tokens: Created/validated in `auth_service/security.py`
- CORS: Configured for `http://localhost:5173` only
- OAuth2 scheme: `oauth2_scheme` defined in auth router

## Common Tasks

**Add new alert condition**: Update `alert_service/schemas.py` condition field, adjust UI conditional in AlertsPage.tsx (line 332)

**Add new portfolio metric**: Add SQLAlchemy column to `portfolio_service/db_models.py`, add field to `schemas.py`, expose via `router.py`

**Fetch new market data**: Extend `marketdata_service/service.py` with new provider or indicator

**Modify database schema**: Update models in `db_models.py`, SQL migrations go in `db/init.sql` before first deployment

## Environment & Dependencies

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.0, psycopg3, python-jose, yfinance
- **Frontend**: Node.js, React 19, TypeScript, Vite, react-router-dom, zod, lightweight-charts
- **Database**: PostgreSQL 16 (Docker container on port 5433)
- **Config**: Load from `.env` using pydantic-settings in `common/config.py`

## Debugging Tips

- **Backend errors**: Check uvicorn terminal for SQLAlchemy constraint errors or missing dependencies
- **Frontend auth**: Verify token in localStorage (`token.ts`); check AuthContext provides token to API calls
- **Database locked**: Run `docker compose down && docker compose up -d` to reset
- **TypeScript errors**: Check `tsconfig.json` paths; rebuild with `tsc -b`
