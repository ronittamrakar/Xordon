# 🚀 Quick Start Guide

## TL;DR - Get Running in 30 Seconds

### Step 1: Start the Servers
```powershell
.\start-dev.ps1
```

Or on Windows CMD:
```cmd
start-dev.bat
```

### Step 2: Open Browser
```
http://127.0.0.1:5173/
```

**Done!** ✅ Your application is running.

---

## What's Running

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://127.0.0.1:5173/ | ✅ Running |
| API | http://localhost:8000/ | ✅ Running |

---

## Common Tasks

### Edit Frontend Code
1. Edit files in `src/` folder
2. Changes auto-reload in browser
3. No restart needed

### Test API Endpoints
```powershell
# Get proposals
curl http://localhost:8000/api/proposals

# Get stats
curl http://localhost:8000/api/proposals/stats
```

### Stop Servers
```powershell
# Kill all node processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

### Build for Production
```powershell
npm run build
```

---

## Troubleshooting

**Port already in use?**
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

**API not responding?**
- Check mock-api-server.cjs is running
- Restart both servers

**Hot reload not working?**
- Refresh browser manually
- Restart Vite server

---

## Documentation

- **Setup Details**: See `DEVELOPMENT_SETUP.md`
- **Full Status**: See `STATUS_REPORT.md`
- **Completion Info**: See `SETUP_COMPLETE.md`

---

## Next Steps

1. ✅ Application is running
2. 🔧 Start developing
3. 📦 Build when ready

**Happy coding!** 🎉
