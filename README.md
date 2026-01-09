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

## Data Initialization (seeding)
Open a second, PowerShell terminal in the backend directory (`/finboard/backend`)

### Activate Virtual Environment
```powershell
.\.venv\Scripts\Activate
```

go to main directory with `cd ..`
### Run script
```powershell
.\seed_all.ps1
```

## Backend
Go back to `/finboard/backend` with PowerShell terminal

### Run Development Server
```powershell
uvicorn src.main:app --reload
```
The API will be available at: http://localhost:8000


## Frontend
Open third terminal in the `/frontend directory`
### Install Dependencies & run application
```powershell
npm install
```
```powershell
npm run dev
```

The dashboard will be available at: http://localhost:5173




---
##### Known limitations
- Historical OHLCV data is seeded manually using Yahoo Finance
- Real-time quotes are fetched from Finnhub (free tier)