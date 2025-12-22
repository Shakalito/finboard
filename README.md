# FinBoard - Financial Market Analysis Dashboard

A financial dashboard application for tracking stock quotes, analyzing historical data, and virtual investing, powered by free stock market APIs.

---

##  Getting Started ( ͡• ͜ʖ ͡• )

This guide assumes you have the following installed: **Docker Desktop**, **Node.js**, and **Python 3.10+**.

### Environment Setup
* Clone the repository to your local machine.
* In the root folder, copy the `.env.example` file and create a new file named `.env`. Fill it with your required API keys.

### Database (Docker)
Ensure **Docker Desktop** is running. Open a terminal in the project root directory (`/finboard`) and run:

```powershell
docker compose down
docker compose up -d
```

## Backend
Open a second terminal in the /backend directory:
### Activate Virtual Environment
```powershell
.\.venv\Scripts\Activate
```

### Run Development Server
```powershell
uvicorn src.main:app --reload
```
The API will be available at: http://localhost:8000


## Frontend
Open a third terminal in the /frontend directory:
### Install Dependencies & run application
```powershell
npm install
```
```powershell
npm run dev
```

The dashboard will be available at: http://localhost:5173

## Data Initialization (seeding)
Open a fourth terminal in the root directory (/finboard), ensure your Python virtual environment is active, and follow these steps:

#### Import Reference Data (Venues and Listings)
```powershell
cmd /c "docker exec -i gielda-db psql -U admin -d gielda < db/seed_refdata.sql"
```

#### Fetch Historical Data (OHLCV) for Specific Tickers
First, check for available listing_id values (e.g., for companies on NASDAQ):
```sql
SELECT l.id, l.ticker FROM refdata.listings l 
JOIN refdata.venues v ON v.id = l.venue_id 
WHERE v.code='NASDAQ' ORDER BY l.ticker;
```

Next, fetch historical data by replacing <ID> with your copied identifier:
```powershell
$env:PYTHONPATH='backend'
python backend/scripts/seed_yahoo_ohlcv.py --listing-id <ID> --period 5y --replace
```



---
##### Known limitations
- Historical OHLCV data is seeded manually using Yahoo Finance
- Real-time quotes are fetched from Finnhub (free tier)