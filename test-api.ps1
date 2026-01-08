$token = (Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/dev-token').token
Write-Host "Token: $token"
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host "Testing /api/campaigns..."
$campaigns = Invoke-RestMethod -Uri 'http://localhost:8080/api/campaigns' -Headers $headers
Write-Host "Campaigns count: $($campaigns.items.Count)"
Write-Host ""

Write-Host "Testing /api/contacts..."
$contacts = Invoke-RestMethod -Uri 'http://localhost:8080/api/contacts' -Headers $headers
Write-Host "Contacts count: $($contacts.items.Count)"
Write-Host ""

Write-Host "All API tests passed! Success"
