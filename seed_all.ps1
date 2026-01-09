param (
    [string]$Tickers,
    [int]$Limit = 0
)

Write-Host ">>> STEP 1: Loading RefData..." -ForegroundColor Cyan
cmd /c "docker exec -i gielda-db psql -U admin -d gielda < db/seed_refdata.sql"
cmd /c "docker exec -i gielda-db psql -U admin -d gielda < db/seed_refdata.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Error "SQL Error. Exiting."
    exit
}

Write-Host ">>> STEP 2: Fetching Listing UUIDs..." -ForegroundColor Cyan

$baseQuery = "SELECT l.id FROM refdata.listings l JOIN refdata.venues v ON v.id = l.venue_id"

if (-not [string]::IsNullOrEmpty($Tickers)) {
    $formattedTickers = $Tickers.Split(',') | ForEach-Object { "'$($_.Trim())'" }
    $inClause = $formattedTickers -join ","
    $query = "$baseQuery WHERE l.ticker IN ($inClause);"
}
else {
    $query = "$baseQuery WHERE v.code='NASDAQ';"
}

$raw_ids = docker exec -i gielda-db psql -U admin -d gielda -t -A -c $query
$ids = $raw_ids -split "`r`n" | ForEach-Object { $_.Trim() } | Where-Object { $_.Length -eq 36 }

if (-not $ids) {
    Write-Warning "Found no IDs in database matching criteria"
    exit
}

if ($Limit -gt 0) {
    $ids = $ids | Select-Object -First $Limit
}

$count = $ids.Count
$current = 0

Write-Host ">>> STEP 3: Found $count Listings. Fetching OHLCV data..." -ForegroundColor Cyan

$env:PYTHONPATH='backend'

foreach ($id in $ids) {
    $current++
    Write-Host "[$current / $count] Fetching for ID: $id" -ForegroundColor Green
    
    try {
        python backend/scripts/seed_yahoo_ohlcv.py --listing-id "$id" --period 5y --replace
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Script exited with error for ID: $id"
        }
    }
    catch {
        Write-Warning "Exception occurred for ID: $id"
    }
}

Write-Host ">>> PROCESS FINISHED" -ForegroundColor Magenta