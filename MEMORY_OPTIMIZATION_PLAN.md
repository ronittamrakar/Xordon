# Memory Optimization Plan for Xordon

## Current Status
- **RAM Usage**: 374MB
- **Target**: <150MB
- **Build Size**: 5.18MB (224 files)

## Issues Identified

### 1. Context Provider Overhead
- **7 nested context providers** in App.tsx
- Each provider maintains state and re-renders
- Solution: Combine related contexts

### 2. React Query Configuration
```typescript
// Current: Aggressive caching
staleTime: 5 * 60 * 1000, // 5 minutes
refetchOnWindowFocus: false,
refetchOnReconnect: false,
refetchOnMount: false,
```
- Caches all queries for 5 minutes
- With 100+ routes, this accumulates quickly

### 3. Lazy Loading Overhead
- **100+ lazy-loaded components** in App.tsx
- Each creates a separate chunk and module
- React.lazy() has memory overhead per component

### 4. Development Mode Issues
- Source maps
- Hot Module Replacement (HMR)
- React DevTools
- Multiple console logs

## Optimization Strategy

### Phase 1: Immediate Wins (Target: -100MB)

#### A. Optimize React Query
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Reduce from 5min to 30s
      cacheTime: 60 * 1000, // Add 1min cache time (then garbage collect)
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: false,
    },
  },
});
```

#### B. Reduce Context Nesting
Combine:
- `AuthContext` + `PermissionContext` → `AuthPermissionContext`
- `ModuleContext` + `CompanyContext` → `WorkspaceContext`

#### C. Implement Route-Based Code Splitting
Instead of lazy loading every component, group by feature:
```typescript
// Before: 100+ lazy loads
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
// ... 98 more

// After: Feature-based chunks
const OutreachPages = lazy(() => import('./features/outreach'));
const CRMPages = lazy(() => import('./features/crm'));
// ... ~10 feature chunks
```

### Phase 2: Advanced Optimizations (Target: -50MB)

#### D. Memoization Strategy
- Add `React.memo()` to expensive components
- Use `useMemo()` for heavy computations
- Use `useCallback()` for event handlers

#### E. Virtual Scrolling
For large lists (contacts, campaigns, etc.):
- Implement `react-window` or `@tanstack/react-virtual`
- Only render visible items

#### F. Image Optimization
- Lazy load images
- Use WebP format
- Implement responsive images

### Phase 3: Build Optimizations (Target: -50MB)

#### G. Tree Shaking
```typescript
// vite.config.ts
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
    },
  },
}
```

#### H. Dependency Audit
Remove or replace heavy dependencies:
- Consider lighter alternatives to Radix UI components
- Audit `lucide-react` usage (tree-shake unused icons)
- Check for duplicate dependencies

### Phase 4: Runtime Optimizations

#### I. Cleanup Effects
Ensure all `useEffect` hooks properly cleanup:
```typescript
useEffect(() => {
  const subscription = api.subscribe();
  return () => subscription.unsubscribe(); // Critical!
}, []);
```

#### J. Debounce/Throttle
Add debouncing to frequent operations:
- Search inputs
- Scroll handlers
- Resize handlers

## Implementation Priority

### High Priority (Do First)
1. ✅ Optimize React Query cache settings
2. ✅ Reduce lazy-loaded components (group by feature)
3. ✅ Combine related contexts
4. ✅ Add cleanup to useEffect hooks

### Medium Priority
5. Add React.memo to heavy components
6. Implement virtual scrolling for lists
7. Audit and remove unused dependencies

### Low Priority
8. Image optimization
9. Advanced tree shaking
10. Service worker caching

## Monitoring

### Measure Before/After
```javascript
// In browser console
performance.memory.usedJSHeapSize / 1024 / 1024 // MB
```

### Chrome DevTools
1. Performance → Memory
2. Take heap snapshot
3. Compare before/after optimizations

## Expected Results

| Phase | Target RAM | Reduction |
|-------|-----------|-----------|
| Current | 374MB | - |
| Phase 1 | 274MB | -100MB |
| Phase 2 | 224MB | -50MB |
| Phase 3 | 174MB | -50MB |
| Phase 4 | <150MB | -24MB |

## Notes

- Development mode typically uses 2-3x more memory than production
- React DevTools adds ~50-100MB overhead
- HMR (Hot Module Replacement) adds ~30-50MB
- **Production build should be <150MB**
