Write-Host "=== Testing Ads Manager API Endpoints ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001/api/ads"
$headers = @{
    "Authorization" = "Bearer dev-token"
    "X-Workspace-Id" = "1"
    "X-Company-Id" = "1"
}

function Test-Endpoint {
    param($name, $url, $method = "GET", $body = $null)
    
    Write-Host "$name..." -NoNewline
    try {
        $params = @{
            Uri = $url
            Method = $method
            Headers = $headers
            ContentType = "application/json"
        }
        if ($body) {
            $params.Body = $body
        }
        
        $response = Invoke-RestMethod @params
        
        if ($response.data -or $response.auth_url) {
            Write-Host " ✓ Success" -ForegroundColor Green
            return $response
        } else {
            Write-Host " ✗ Error: $($response.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host " ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 1: Get Accounts
$accounts = Test-Endpoint "1. GET /ads/accounts" "$baseUrl/accounts"
if ($accounts.data) {
    Write-Host "   Found $($accounts.data.Count) ad accounts" -ForegroundColor Gray
}

Write-Host ""

# Test 2: Get Campaigns
$campaigns = Test-Endpoint "2. GET /ads/campaigns" "$baseUrl/campaigns"
if ($campaigns.data) {
    Write-Host "   Found $($campaigns.data.Count) campaigns" -ForegroundColor Gray
    if ($campaigns.data.Count -gt 0) {
        $sample = $campaigns.data[0]
        Write-Host "   Sample: $($sample.name) - Status: $($sample.status)" -ForegroundColor Gray
    }
}

Write-Host ""

# Test 3: Get Analytics
$analytics = Test-Endpoint "3. GET /ads/analytics" "$baseUrl/analytics"
if ($analytics.data.overall) {
    $overall = $analytics.data.overall
    Write-Host "   Total Spend: $"$($overall.total_spend) -ForegroundColor Gray
    Write-Host "   Total Clicks: $($overall.total_clicks)" -ForegroundColor Gray
    Write-Host "   Total Conversions: $($overall.total_conversions)" -ForegroundColor Gray
}

Write-Host ""

# Test 4: Get Budgets
$budgets = Test-Endpoint "4. GET /ads/budgets" "$baseUrl/budgets"
if ($budgets.data) {
    Write-Host "   Found $($budgets.data.Count) budgets" -ForegroundColor Gray
}

Write-Host ""

# Test 5: Get Conversions
$conversions = Test-Endpoint "5. GET /ads/conversions" "$baseUrl/conversions"
if ($conversions.data) {
    Write-Host "   Found $($conversions.data.Count) conversions" -ForegroundColor Gray
}

Write-Host ""

# Test 6: Get A/B Tests
$abTests = Test-Endpoint "6. GET /ads/ab-tests" "$baseUrl/ab-tests"
if ($abTests.data) {
    Write-Host "   Found $($abTests.data.Count) A/B tests" -ForegroundColor Gray
}

Write-Host ""

# Test 7: Sync Campaigns (Button Test)
$sync = Test-Endpoint "7. POST /ads/campaigns/sync" "$baseUrl/campaigns/sync" "POST"
if ($sync.data) {
    Write-Host "   $($sync.data.message)" -ForegroundColor Gray
}

Write-Host ""

# Test 8: OAuth URL (Connect Account Button)
$oauth = Test-Endpoint "8. GET /ads/oauth/google" "$baseUrl/oauth/google"
if ($oauth.auth_url) {
    Write-Host "   OAuth URL: $($oauth.auth_url)" -ForegroundColor Gray
}

Write-Host ""

# Test 9: Create Campaign (Button Test)
Write-Host "9. POST /ads/campaigns (Create Campaign button)..." -NoNewline
$campaignData = @{
    name = "Test Campaign $(Get-Date -Format 'yyyyMMddHHmmss')"
    platform = "google_ads"
    campaign_type = "search"
    daily_budget = 50.00
    status = "draft"
} | ConvertTo-Json

try {
    $newCampaign = Invoke-RestMethod -Uri "$baseUrl/campaigns" -Method POST -Headers $headers -Body $campaignData -ContentType "application/json"
    if ($newCampaign.data.id) {
        Write-Host " ✓ Success" -ForegroundColor Green
        Write-Host "   Created campaign with ID: $($newCampaign.data.id)" -ForegroundColor Gray
    }
} catch {
    Write-Host " ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== All Tests Complete ===" -ForegroundColor Cyan
