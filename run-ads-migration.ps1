$host.UI.RawUI.WindowTitle = "Running Ads Manager Migration"

Write-Host "Running Ads Manager database migration..." -ForegroundColor Cyan

try {
    $db = New-Object System.Data.Odbc.OdbcConnection
    $connString = "DRIVER={MySQL ODBC 8.0 Driver};SERVER=127.0.0.1;DATABASE=xordon;UID=root;PWD=;"
    
    # Try using PHP to run the migration
    $phpCommand = @"
`$db = new PDO('mysql:host=127.0.0.1;dbname=xordon', 'root', '');
`$sql = file_get_contents('migrations/add_ads_manager.sql');
`$statements = array_filter(array_map('trim', explode(';', `$sql)));
foreach (`$statements as `$statement) {
    if (!empty(`$statement)) {
        try {
            `$db->exec(`$statement);
        } catch (Exception `$e) {
            if (strpos(`$e->getMessage(), 'already exists') === false) {
                echo 'Error: ' . `$e->getMessage() . PHP_EOL;
            }
        }
    }
}
echo 'Migration completed successfully' . PHP_EOL;
"@
    
    Set-Location "d:\Backup\App Backups\Xordon\backend"
    $phpCommand | php
    
    Write-Host "`nMigration completed!" -ForegroundColor Green
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`nNote: If tables already exist, you can ignore 'already exists' errors" -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
