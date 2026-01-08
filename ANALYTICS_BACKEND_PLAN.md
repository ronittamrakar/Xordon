# Analytics Backend Implementation Plan

## Strategy

Since dedicated analytics endpoints don't exist for most modules, we'll:
1. **Use existing data endpoints** and aggregate on the frontend
2. **Create helper functions** to transform data into analytics
3. **Add TODO comments** for future backend optimization
4. **Maintain graceful fallback** to mock data

## Implementation Order (By Data Availability)

### ✅ Phase 1: Already Integrated
1. Email Analytics - `api.getAnalytics()`
2. SMS Analytics - `api.getSMSAnalytics()`
3. Call Analytics - `api.getCallAnalytics()`
4. Proposal Analytics - `proposalApi.getProposalStats()`
5. Form Analytics - `api.getFormAnalytics()`

### 🔄 Phase 2: Data Available - Aggregate Frontend
6. **Marketing Analytics** - Combine campaigns + forms + landing pages
7. **Project Analytics** - Use project data if available
8. **AI Workforce Analytics** - Use AI workforce endpoints

### 📝 Phase 3: Need Backend Endpoints
9. Finance Analytics
10. Estimates Analytics
11. Field Service Analytics
12. Scheduling Analytics
13. Ecommerce Analytics
14. HR Analytics
15. Culture Analytics
16. Reputation Analytics
17. Courses Analytics
18. Automation Analytics
19. AI Analytics
20. Website Analytics

## Missing Endpoints to Create

```typescript
// Backend endpoints needed:
POST /api/analytics/finance - Invoice/payment aggregation
POST /api/analytics/scheduling - Appointment metrics
POST /api/analytics/ecommerce - Order/product metrics
POST /api/analytics/hr - Employee/attendance metrics
POST /api/analytics/culture - Survey/engagement metrics
POST /api/analytics/reputation - Review aggregation
POST /api/analytics/courses - LMS metrics
POST /api/analytics/automation - Workflow execution stats
POST /api/analytics/ai-agents - AI performance metrics
POST /api/analytics/websites - Website/landing page metrics
POST /api/analytics/field-service - Operations/jobs metrics
POST /api/analytics/estimates - Estimates pipeline metrics
```

## Implementation Approach

For each module without a dedicated endpoint:
1. Check if we can aggregate from existing endpoints
2. If yes, create aggregation logic in the analytics page
3. If no, keep mock data with clear TODO comments
4. Add error handling and fallback

This allows the UI to work immediately while backend catches up.
