#!/usr/bin/env pwsh
# Test script for Listings Audit API endpoints

$baseUrl = "http://localhost:8000"
$token = "dev-token-placeholder" # Replace with actual token

Write-Host "Testing Listings Audit API Endpoints" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get Audits
Write-Host "[1] Testing GET /listings/audits..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/listings/audits" -Method Get -Headers @{
        "Authorization" = "Bearer $token"
        "X-Workspace-Id" = "1"
        "X-Company-Id" = "1"
    } -ErrorAction Stop
    Write-Host "✓ Success: Found $($response.data.Count) audits" -ForegroundColor Green
    if ($response.data.Count -gt 0) {
        Write-Host "  Latest audit: ID=$($response.data[0].id), Status=$($response.data[0].status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Get Duplicates
Write-Host "[2] Testing GET /listings/duplicates..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/listings/duplicates" -Method Get -Headers @{
        "Authorization" = "Bearer $token"
        "X-Workspace-Id" = "1"
        "X-Company-Id" = "1"
    } -ErrorAction Stop
    Write-Host "✓ Success: Found $($response.data.Count) duplicates" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Start Audit
Write-Host "[3] Testing POST /listings/audits (Start Audit)..." -ForegroundColor Yellow
try {
    $body = @{
        scan_type = "standard"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/listings/audits" -Method Post -Headers @{
        "Authorization" = "Bearer $token"
        "X-Workspace-Id" = "1"
        "X-Company-Id" = "1"
        "Content-Type" = "application/json"
    } -Body $body -ErrorAction Stop
    Write-Host "✓ Success: Audit started with ID=$($response.data.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Listings (for context)
Write-Host "[4] Testing GET /listings (for context)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/listings" -Method Get -Headers @{
        "Authorization" = "Bearer $token"
        "X-Workspace-Id" = "1"
        "X-Company-Id" = "1"
    } -ErrorAction Stop
    Write-Host "✓ Success: Found $($response.data.Count) listings" -ForegroundColor Green
    if ($response.data.Count -gt 0) {
        Write-Host "  Sample listing: $($response.data[0].business_name) - $($response.data[0].directory_name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get Settings (for NAP data)
Write-Host "[5] Testing GET /listings/settings (for NAP data)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/listings/settings" -Method Get -Headers @{
        "Authorization" = "Bearer $token"
        "X-Workspace-Id" = "1"
        "X-Company-Id" = "1"
    } -ErrorAction Stop
    Write-Host "✓ Success: Settings retrieved" -ForegroundColor Green
    Write-Host "  Business: $($response.data.business_name)" -ForegroundColor Gray
    Write-Host "  Address: $($response.data.address)" -ForegroundColor Gray
    Write-Host "  Phone: $($response.data.phone)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:5173/marketing/listings?id=1&tab=audit" -ForegroundColor White
Write-Host "2. Verify all tabs render correctly" -ForegroundColor White
Write-Host "3. Click 'Run Audit' to test audit functionality" -ForegroundColor White
Write-Host "4. Check each sub-tab (Overview, NAP Analysis, Issues, Duplicates, History)" -ForegroundColor White
Write-Host "5. Test Export and Settings buttons" -ForegroundColor White
