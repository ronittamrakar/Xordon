# Server Restart Log
Date: 2026-01-03
Time: 11:25 AM (estimated)

## Issue
User reported `net::ERR_EMPTY_RESPONSE` for API calls and `net::ERR_CONNECTION_REFUSED` for the frontend.
Diagnosed that backend (port 8001) and/or frontend (port 5173) were unresponsive or down.

## Action
Executed `start-dev.ps1` script to:
1. Kill existing processes on ports 8001 and 5173-5179.
2. Verify MySQL connection.
3. Start PHP backend on port 8001.
4. Start Vite frontend on port 5173.

## Status
- Frontend: `http://localhost:5173/` (LISTENING)
- Backend: `http://localhost:8001/` (Started)

## Recommendation
- Reload the browser page.
- If auth errors persist, clear localStorage.
