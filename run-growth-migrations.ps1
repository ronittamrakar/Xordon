# Run Growth Suite Migrations
Write-Host "Running Growth Suite database migrations..." -ForegroundColor Cyan

$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
$user = "xordon"
$password = "xordon"
$database = "xordon"

$migrations = @(
    "backend\migrations\social_scheduler.sql",
    "backend\migrations\listings_seo.sql",
    "backend\migrations\ads_integrations.sql"
)

foreach ($migration in $migrations) {
    $migrationName = Split-Path $migration -Leaf
    Write-Host "`nRunning $migrationName..." -ForegroundColor Yellow
    
    if (Test-Path $migration) {
        & $mysqlPath -u $user -p$password $database -e "source $migration" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $migrationName completed successfully" -ForegroundColor Green
        } else {
            Write-Host "✗ $migrationName failed (may already exist)" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Migration file not found: $migration" -ForegroundColor Red
    }
}

Write-Host "`nGrowth Suite migrations completed!" -ForegroundColor Cyan
