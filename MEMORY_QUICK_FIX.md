# Quick Memory Optimization Guide

## ✅ Completed Optimizations

### 1. React Query Cache Reduction
- **Before**: 5 minutes staleTime
- **After**: 30 seconds staleTime + 2 minutes garbage collection
- **Expected Savings**: ~50-80MB

### 2. Context Query Optimization
- Reduced CompanyContext queries from 5min to 1min
- Reduced WorkspaceContext queries from 5min to 1min
- **Expected Savings**: ~20-30MB

## 🔧 Quick Fixes You Can Do Now

### Option 1: Use Production Build (Fastest)
```bash
npm run build
npm run preview
```
**Expected RAM**: ~150-200MB (vs 374MB in dev mode)

### Option 2: Disable React DevTools
1. Open Chrome DevTools
2. Go to Extensions
3. Disable "React Developer Tools"
**Savings**: ~50-100MB

### Option 3: Close Unused Tabs
Each browser tab with the app open consumes memory
**Savings**: ~374MB per tab closed

### Option 4: Enable Memory Monitoring
Add to `src/App.tsx` (after imports):
```typescript
import { enableMemoryLogging } from '@/lib/memoryUtils';

// Inside App component
useEffect(() => {
  const cleanup = enableMemoryLogging();
  return cleanup;
}, []);
```

## 📊 Measure Current Memory

### In Browser Console:
```javascript
// Check current memory
performance.memory.usedJSHeapSize / 1024 / 1024 // MB

// Monitor continuously
setInterval(() => {
  console.log('Memory:', Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), 'MB');
}, 5000);
```

### Chrome DevTools:
1. Open DevTools (F12)
2. Go to "Memory" tab
3. Click "Take heap snapshot"
4. Look for large objects

## 🎯 Next Steps (If Still High)

### 1. Analyze Bundle Size
```bash
npm install -D rollup-plugin-visualizer
npm run build -- --mode analyze
```
Opens `dist/stats.html` showing what's taking up space

### 2. Find Memory Leaks
```bash
# Chrome DevTools → Memory → Allocation Timeline
# Record for 30 seconds while navigating
# Look for objects that keep growing
```

### 3. Reduce Lazy-Loaded Components
Currently loading 100+ components individually. Consider grouping by feature.

## 🚨 Known Memory Hogs

### Development Mode Overhead
- **HMR (Hot Module Replacement)**: ~30-50MB
- **Source Maps**: ~50-100MB
- **React DevTools**: ~50-100MB
- **Vite Dev Server**: ~20-30MB
- **Total Dev Overhead**: ~150-280MB

### Production vs Development
| Environment | Expected RAM |
|-------------|--------------|
| Development | 300-400MB |
| Production | 100-150MB |

## 💡 Pro Tips

### 1. Restart Dev Server Regularly
```bash
# Memory accumulates over time with HMR
# Restart every few hours
Ctrl+C
npm run dev
```

### 2. Use Incognito Mode
- No extensions
- No cached data
- Clean slate for testing

### 3. Monitor Over Time
```javascript
// Add to browser console
const start = performance.memory.usedJSHeapSize;
setTimeout(() => {
  const end = performance.memory.usedJSHeapSize;
  const diff = (end - start) / 1024 / 1024;
  console.log('Memory growth:', diff.toFixed(2), 'MB');
}, 60000); // After 1 minute
```

## 📈 Expected Results

| Action | Memory Reduction |
|--------|------------------|
| ✅ React Query optimization | -50 to -80MB |
| ✅ Context optimization | -20 to -30MB |
| Switch to production build | -150 to -200MB |
| Disable React DevTools | -50 to -100MB |
| **Total Potential Savings** | **-270 to -410MB** |

## 🎉 Success Criteria

- **Development**: <250MB is good, <200MB is excellent
- **Production**: <150MB is good, <100MB is excellent

## 🔍 Debugging Commands

```bash
# Check Node.js memory
node --max-old-space-size=4096 # Increase if needed

# Check Vite memory
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Build with memory profiling
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## 📞 Need Help?

If memory is still high after these optimizations:
1. Take a heap snapshot (Chrome DevTools → Memory)
2. Look for "Detached DOM nodes" (memory leaks)
3. Check for large arrays or objects in snapshot
4. Review useEffect cleanup functions
