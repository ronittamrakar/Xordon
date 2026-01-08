@echo off
echo === Testing Ads Manager API Endpoints ===
echo.

set BASE_URL=http://localhost:3001/api/ads
set AUTH=-H "Authorization: Bearer dev-token" -H "X-Workspace-Id: 1" -H "X-Company-Id: 1"

echo 1. Testing GET /ads/accounts...
curl -s %AUTH% %BASE_URL%/accounts
echo.
echo.

echo 2. Testing GET /ads/campaigns...
curl -s %AUTH% %BASE_URL%/campaigns
echo.
echo.

echo 3. Testing GET /ads/analytics...
curl -s %AUTH% %BASE_URL%/analytics
echo.
echo.

echo 4. Testing GET /ads/budgets...
curl -s %AUTH% %BASE_URL%/budgets
echo.
echo.

echo 5. Testing GET /ads/conversions...
curl -s %AUTH% %BASE_URL%/conversions
echo.
echo.

echo 6. Testing GET /ads/ab-tests...
curl -s %AUTH% %BASE_URL%/ab-tests
echo.
echo.

echo 7. Testing POST /ads/campaigns/sync...
curl -s -X POST %AUTH% %BASE_URL%/campaigns/sync
echo.
echo.

echo 8. Testing GET /ads/oauth/google...
curl -s %AUTH% %BASE_URL%/oauth/google
echo.
echo.

echo === All Tests Complete ===
