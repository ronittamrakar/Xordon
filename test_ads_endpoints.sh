#!/bin/bash

echo "=== Testing Ads Manager API Endpoints ==="
echo ""

BASE_URL="http://localhost:3001/api/ads"
AUTH_HEADER="Authorization: Bearer dev-token"
WORKSPACE_HEADER="X-Workspace-Id: 1"
COMPANY_HEADER="X-Company-Id: 1"

echo "1. Testing GET /ads/accounts..."
curl -s -H "$AUTH_HEADER" -H "$WORKSPACE_HEADER" -H "$COMPANY_HEADER" "$BASE_URL/accounts" | jq -r 'if .data then "✓ Success: Found \(.data | length) ad accounts" else "✗ Error: \(.error)" end'

echo ""
echo "2. Testing GET /ads/campaigns..."
curl -s -H "$AUTH_HEADER" -H "$WORKSPACE_HEADER" -H "$COMPANY_HEADER" "$BASE_URL/campaigns" | jq -r 'if .data then "✓ Success: Found \(.data | length) campaigns" else "✗ Error: \(.error)" end'

echo ""
echo "3. Testing GET /ads/analytics..."
curl -s -H "$AUTH_HEADER" -H "$WORKSPACE_HEADER" -H "$COMPANY_HEADER" "$BASE_URL/analytics" | jq -r 'if .data.overall then "✓ Success: Total Spend: $\(.data.overall.total_spend), Clicks: \(.data.overall.total_clicks)" else "✗ Error: \(.error)" end'

echo ""
echo "4. Testing GET /ads/budgets..."
curl -s -H "$AUTH_HEADER" -H "$WORKSPACE_HEADER" -H "$COMPANY_HEADER" "$BASE_URL/budgets" | jq -r 'if .data then "✓ Success: Found \(.data | length) budgets" else "✗ Error: \(.error)" end'

echo ""
echo "5. Testing GET /ads/conversions..."
curl -s -H "$AUTH_HEADER" -H "$WORKSPACE_HEADER" -H "$COMPANY_HEADER" "$BASE_URL/conversions" | jq -r 'if .data then "✓ Success: Found \(.data | length) conversions" else "✗ Error: \(.error)" end'

echo ""
echo "6. Testing GET /ads/ab-tests..."
curl -s -H "$AUTH_HEADER" -H "$WORKSPACE_HEADER" -H "$COMPANY_HEADER" "$BASE_URL/ab-tests" | jq -r 'if .data then "✓ Success: Found \(.data | length) A/B tests" else "✗ Error: \(.error)" end'

echo ""
echo "7. Testing POST /ads/campaigns/sync (Sync button)..."
curl -s -X POST -H "$AUTH_HEADER" -H "$WORKSPACE_HEADER" -H "$COMPANY_HEADER" "$BASE_URL/campaigns/sync" | jq -r 'if .data then "✓ Success: \(.data.message)" else "✗ Error: \(.error)" end'

echo ""
echo "8. Testing GET /ads/oauth/google (Connect Account button)..."
curl -s -H "$AUTH_HEADER" -H "$WORKSPACE_HEADER" -H "$COMPANY_HEADER" "$BASE_URL/oauth/google" | jq -r 'if .auth_url then "✓ Success: OAuth URL generated" else "✗ Error: \(.error)" end'

echo ""
echo "=== All Tests Complete ==="
