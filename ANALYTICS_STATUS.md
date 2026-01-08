# Analytics Pages Status & API Integration

## ✅ Existing Analytics Pages

### Already Implemented with Real APIs
1. **Call Analytics** (`/reach/calls/analytics`)
   - File: `src/pages/calls/CallAnalytics.tsx`
   - API: `api.getCallAnalytics()` ✅
   - Status: **FULLY INTEGRATED**

2. **Proposal Analytics** (`/proposals/analytics`)
   - File: `src/pages/ProposalAnalytics.tsx`
   - API: `proposalApi.getProposalStats()` ✅
   - Status: **FULLY INTEGRATED**

3. **Form Analytics** (`/forms/analytics`)
   - File: `src/pages/webforms/WebFormsAnalytics.tsx`
   - API: `api.getFormAnalytics()` ✅
   - Status: **FULLY INTEGRATED**

4. **Project Analytics** (`/projects/analytics`)
   - File: `src/pages/projects/ProjectAnalytics.tsx`
   - API: Likely integrated
   - Status: **NEEDS VERIFICATION**

5. **AI Workforce Analytics** (`/ai/workforce/analytics`)
   - File: `src/pages/ai/workforce/WorkforceAnalytics.tsx`
   - API: Custom AI workforce API
   - Status: **INTEGRATED**

### Recently Created - Need API Integration
6. **Email Analytics** (`/reach/email/analytics`)
   - File: `src/pages/reach/analytics/EmailAnalytics.tsx`
   - API Available: `api.getAnalytics()` for email ✅
   - Status: **MOCK DATA - NEEDS INTEGRATION**

7. **SMS Analytics** (`/reach/sms/analytics`)
   - File: `src/pages/reach/analytics/SMSAnalytics.tsx`
   - API Available: `api.getSMSAnalytics()` ✅
   - Status: **MOCK DATA - NEEDS INTEGRATION**

8. **Marketing Analytics** (`/marketing/analytics`)
   - File: `src/pages/marketing/MarketingAnalytics.tsx`
   - API Available: Partial (campaigns, forms, landing pages)
   - Status: **MOCK DATA - NEEDS INTEGRATION**

9. **Website Analytics** (`/websites/analytics`)
   - File: `src/pages/websites/WebsiteAnalytics.tsx`
   - API Available: Need to check website API
   - Status: **MOCK DATA - NEEDS INTEGRATION**

10. **Finance Analytics** (`/finance/analytics`)
    - File: `src/pages/finance/FinanceAnalytics.tsx`
    - API Available: Need to check finance/invoice API
    - Status: **MOCK DATA - NEEDS INTEGRATION**

11. **Estimates Analytics** (`/finance/estimates/analytics`)
    - File: `src/pages/finance/EstimatesAnalytics.tsx`
    - API Available: Need to check estimates API
    - Status: **MOCK DATA - NEEDS INTEGRATION**

12. **Field Service Analytics** (`/operations/field-service/analytics`)
    - File: `src/pages/operations/FieldServiceAnalytics.tsx`
    - API Available: Need to check operations API
    - Status: **MOCK DATA - NEEDS INTEGRATION**

13. **Scheduling Analytics** (`/scheduling/analytics`)
    - File: `src/pages/scheduling/SchedulingAnalytics.tsx`
    - API Available: Need to check scheduling/appointments API
    - Status: **MOCK DATA - NEEDS INTEGRATION**

14. **Ecommerce Analytics** (`/ecommerce/analytics`)
    - File: `src/pages/ecommerce/EcommerceAnalytics.tsx`
    - API Available: Need to check ecommerce API
    - Status: **MOCK DATA - NEEDS INTEGRATION**

15. **HR Analytics** (`/hr/analytics`)
    - File: `src/pages/hr/HRAnalytics.tsx`
    - API Available: Need to check HR API
    - Status: **MOCK DATA - NEEDS INTEGRATION**

16. **Culture Analytics** (`/culture/analytics`)
    - File: `src/pages/culture/CultureAnalytics.tsx`
    - API Available: Need to check culture API
    - Status: **MOCK DATA - NEEDS INTEGRATION**

17. **Reputation Analytics** (`/reputation/analytics`)
    - File: `src/pages/reputation/ReputationAnalytics.tsx`
    - API Available: Need to check reputation/reviews API
    - Status: **MOCK DATA - NEEDS INTEGRATION**

18. **Courses/LMS Analytics** (`/courses/analytics`)
    - File: `src/pages/courses/CoursesAnalytics.tsx`
    - API Available: Need to check courses API
    - Status: **MOCK DATA - NEEDS INTEGRATION**

19. **Automation Analytics** (`/automations/analytics`)
    - File: `src/pages/automations/AutomationAnalytics.tsx`
    - API Available: Need to check automation/workflow API
    - Status: **MOCK DATA - NEEDS INTEGRATION**

20. **AI Analytics** (`/ai/analytics`)
    - File: `src/pages/ai/AIAnalytics.tsx`
    - API Available: Need to check AI agents API
    - Status: **MOCK DATA - NEEDS INTEGRATION**

## 🔍 Potentially Missing Analytics Pages

Based on the feature registry, these modules might benefit from analytics:

1. **CRM/Pipeline Analytics** - Deals, pipeline stages, conversion rates
2. **Helpdesk Analytics** - Ticket volume, response times, satisfaction
3. **Social Media Analytics** - If social posting exists
4. **Affiliate Analytics** - If affiliate program exists
5. **Webinar Analytics** - If webinars module exists
6. **Loyalty Analytics** - If loyalty program exists

## 📊 Available API Endpoints

### Confirmed Analytics APIs:
- `/analytics/summary` - General analytics
- `/sms-analytics` - SMS analytics
- `/calls/analytics` - Call analytics
- `/analytics/combined` - Combined channel analytics
- Form analytics endpoint exists
- Proposal stats endpoint exists

### Need to Verify:
- Marketing campaign analytics
- Website/landing page analytics
- Finance/invoice analytics
- Ecommerce/order analytics
- HR/employee analytics
- Scheduling/appointment analytics
- Automation workflow analytics
- AI agent analytics

## 🎯 Action Plan

### Phase 1: Integrate Existing APIs (High Priority)
1. ✅ Email Analytics - Use `api.getAnalytics()`
2. ✅ SMS Analytics - Use `api.getSMSAnalytics()`
3. ⏳ Marketing Analytics - Combine campaign, form, landing page data
4. ⏳ Website Analytics - Check website API

### Phase 2: Create Missing API Endpoints (Medium Priority)
5. Finance Analytics - Create invoice/payment aggregation endpoint
6. HR Analytics - Create employee/attendance aggregation endpoint
7. Scheduling Analytics - Create appointment aggregation endpoint
8. Ecommerce Analytics - Create order/product aggregation endpoint

### Phase 3: Advanced Analytics (Low Priority)
9. Automation Analytics - Workflow execution stats
10. AI Analytics - Agent performance metrics
11. Culture Analytics - Survey/engagement data
12. Reputation Analytics - Review aggregation

## 📝 Notes

- All mock data functions follow the same pattern: `generateMockData()`
- All pages use `useQuery` from `@tanstack/react-query`
- TODO comments mark where API integration is needed
- Charts use `recharts` library consistently
- Date filtering and export functionality is standard across pages
