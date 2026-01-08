# Development Setup Guide

## Quick Start

The application is now fully configured and running with:

- **Frontend**: Vite dev server on `http://127.0.0.1:5173/`
- **API**: Mock API server on `http://localhost:8000/`

### Current Status

✅ **Both servers are running and connected**

## Running the Application

### Option 1: Using PowerShell Script (Recommended)
```powershell
.\start-dev.ps1
```

### Option 2: Manual Start

**Terminal 1 - Start Mock API Server:**
```powershell
node mock-api-server.cjs
```

**Terminal 2 - Start Vite Dev Server:**
```powershell
npm run dev
```

## What's Fixed

1. ✅ **Vite Dev Server** - Running on port 5173
2. ✅ **Mock API Server** - Running on port 8000 with mock data
3. ✅ **CORS Configuration** - Properly configured for local development
4. ✅ **API Proxy** - Vite proxy configured to forward `/api/*` requests to the mock server
5. ✅ **Hot Module Replacement** - Working for frontend changes

## Accessing the Application

Open your browser and navigate to:
```
http://127.0.0.1:5173/
```

## API Endpoints Available

The mock API server provides the following endpoints:

- `GET /api/proposals` - List proposals
- `GET /api/proposals/stats` - Proposal statistics
- `GET /api/templates` - Email templates
- `GET /api/sms-templates` - SMS templates
- `GET /api/forms` - Forms
- `GET /api/campaigns` - Campaigns
- `GET /api/contacts/tags` - Contact tags
- `GET /api/sending-accounts` - Sending accounts
- `GET /api/lists` - Contact lists
- `GET /api/users` - Users
- `GET /api/call-scripts` - Call scripts
- `GET /api/landing-pages` - Landing pages
- `GET /api/sms-campaigns` - SMS campaigns
- `GET /api/call-campaigns` - Call campaigns
- `GET /api/flows` - Automation flows
- `POST /api/upload` - Image upload

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error:

```powershell
# Kill all node processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# Then restart
.\start-dev.ps1
```

### Vite Not Connecting to API
The Vite proxy should automatically forward requests. If you see 404 errors:
1. Ensure the mock API server is running on port 8000
2. Check the browser console for the actual error
3. Restart both servers

### Hot Reload Not Working
This is normal during initial setup. Refresh the browser manually if needed.

## Next Steps

To integrate with a real backend:

1. Replace the mock API server with your actual PHP backend
2. Update the Vite proxy configuration in `vite.config.ts` if needed
3. Ensure your backend is running on port 8000 or update the proxy target

## Development Notes

- The mock API server returns sample data for all endpoints
- All API responses include proper CORS headers
- The frontend is configured to use the Vite proxy for all `/api/*` requests
- Changes to frontend code will hot-reload automatically
