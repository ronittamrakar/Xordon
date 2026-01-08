# Reputation Module - Complete Implementation Guide

## ✅ COMPLETED

### 1. Database Layer
- ✅ Created `reputation_module.sql` migration
- ✅ Tables created:
  - `reviews` - Store all customer reviews
  - `review_requests` - Track review request campaigns
  - `review_widgets` - Widget configurations
  - `reputation_ai_agents` - AI response agents
  - `review_request_templates` - SMS/Email templates
  - `reputation_settings` - Workspace settings
  - `business_listings` - Business listing management
  - `reputation_integrations` - Platform integrations

### 2. Frontend API Service
- ✅ Created `src/services/reputationApi.ts`
- ✅ All TypeScript interfaces defined
- ✅ Complete API methods for all entities

## 🚧 IN PROGRESS - Backend Controllers

### Required Backend Files:

#### 1. `backend/src/controllers/ReputationController.php`
Handles:
- GET /reputation/stats - Overview statistics
- GET /reputation/reviews - List reviews with filters
- GET /reputation/reviews/:id - Single review
- POST /reputation/reviews/:id/reply - Reply to review
- PATCH /reputation/reviews/:id - Update review (spam, etc)
- DELETE /reputation/reviews/:id - Delete review

#### 2. `backend/src/controllers/ReviewRequestsController.php`
Handles:
- GET /reputation/requests - List requests
- POST /reputation/requests - Create new request
- POST /reputation/requests/:id/send - Send request
- POST /reputation/requests/:id/retry - Retry failed request
- DELETE /reputation/requests/:id - Delete request

#### 3. `backend/src/controllers/WidgetsController.php`
Handles:
- GET /reputation/widgets - List widgets
- GET /reputation/widgets/:id - Single widget
- POST /reputation/widgets - Create widget
- PATCH /reputation/widgets/:id - Update widget
- DELETE /reputation/widgets/:id - Delete widget
- GET /reputation/widgets/:id/embed-code - Generate embed code

#### 4. `backend/src/controllers/AIAgentsController.php`
Handles:
- GET /reputation/ai-agents - List agents
- GET /reputation/ai-agents/:id - Single agent
- POST /reputation/ai-agents - Create agent
- PATCH /reputation/ai-agents/:id - Update agent
- DELETE /reputation/ai-agents/:id - Delete agent
- POST /reputation/ai-agents/:id/generate - Generate AI response

#### 5. `backend/src/controllers/ReputationSettingsController.php`
Handles:
- GET /reputation/settings - Get settings
- PATCH /reputation/settings - Update settings

#### 6. `backend/src/controllers/BusinessListingsController.php`
Handles:
- GET /reputation/listings - List listings
- POST /reputation/listings - Create listing
- PATCH /reputation/listings/:id - Update listing
- DELETE /reputation/listings/:id - Delete listing
- POST /reputation/listings/:id/sync - Sync with platform

### Required Routes in `backend/public/index.php`

```php
// Reputation Module Routes
$router->get('/reputation/stats', 'ReputationController@getStats');
$router->get('/reputation/reviews', 'ReputationController@getReviews');
$router->get('/reputation/reviews/{id}', 'ReputationController@getReview');
$router->post('/reputation/reviews/{id}/reply', 'ReputationController@replyToReview');
$router->patch('/reputation/reviews/{id}', 'ReputationController@updateReview');
$router->delete('/reputation/reviews/{id}', 'ReputationController@deleteReview');

$router->get('/reputation/requests', 'ReviewRequestsController@getRequests');
$router->post('/reputation/requests', 'ReviewRequestsController@createRequest');
$router->post('/reputation/requests/{id}/send', 'ReviewRequestsController@sendRequest');
$router->delete('/reputation/requests/{id}', 'ReviewRequestsController@deleteRequest');

$router->get('/reputation/widgets', 'WidgetsController@getWidgets');
$router->post('/reputation/widgets', 'WidgetsController@createWidget');
$router->get('/reputation/widgets/{id}', 'WidgetsController@getWidget');
$router->patch('/reputation/widgets/{id}', 'WidgetsController@updateWidget');
$router->delete('/reputation/widgets/{id}', 'WidgetsController@deleteWidget');

$router->get('/reputation/ai-agents', 'AIAgentsController@getAgents');
$router->post('/reputation/ai-agents', 'AIAgentsController@createAgent');
$router->patch('/reputation/ai-agents/{id}', 'AIAgentsController@updateAgent');
$router->delete('/reputation/ai-agents/{id}', 'AIAgentsController@deleteAgent');

$router->get('/reputation/settings', 'ReputationSettingsController@getSettings');
$router->patch('/reputation/settings', 'ReputationSettingsController@updateSettings');

$router->get('/reputation/listings', 'BusinessListingsController@getListings');
$router->post('/reputation/listings', 'BusinessListingsController@createListing');
$router->patch('/reputation/listings/{id}', 'BusinessListingsController@updateListing');
```

## 📝 NEXT STEPS - Frontend Pages

### 1. Update `src/pages/reputation/Overview.tsx`
- ✅ Already has basic UI
- ⏳ Connect to `reputationApi.getStats()`
- ⏳ Add real-time data fetching
- ⏳ Add loading states
- ⏳ Add error handling

### 2. Implement `src/pages/reputation/Reviews.tsx`
- ⏳ Review list with filters (platform, rating, sentiment)
- ⏳ Search functionality
- ⏳ Reply to reviews
- ⏳ Mark as spam
- ⏳ AI summary modal
- ⏳ Pagination

### 3. Implement `src/pages/reputation/Requests.tsx`
- ⏳ Request list with status filters
- ⏳ Create new request modal
- ⏳ Multi-channel support (SMS, Email, WhatsApp)
- ⏳ Template selection
- ⏳ Bulk actions
- ⏳ Retry failed requests

### 4. Implement `src/pages/reputation/Widgets.tsx`
- ⏳ Widget list
- ⏳ Widget builder (reuse WidgetBuilder component)
- ⏳ Live preview
- ⏳ Embed code generation
- ⏳ Template library

### 5. Implement `src/pages/reputation/Listings.tsx`
- ⏳ Business listings grid
- ⏳ Platform integration status
- ⏳ Sync functionality
- ⏳ Add new listing
- ⏳ Verification status

### 6. Implement `src/pages/reputation/Settings.tsx`
- ⏳ Move all settings from ReputationHub.tsx
- ⏳ AI Agents management
- ⏳ Review Link configuration
- ⏳ SMS/Email/WhatsApp settings
- ⏳ Template management
- ⏳ Integration connections
- ⏳ Spam detection settings

## 🔗 Integration Points

### With Contacts Module
- Link reviews to contacts via `contact_id`
- Fetch contact details for review requests
- Update contact engagement scores

### With Communications
- Send SMS via SMS module
- Send emails via Email module
- Track delivery status

### With AI Module
- Use AI service for response generation
- Sentiment analysis
- Spam detection

### With Analytics/Reports
- Review metrics
- Response rates
- Platform performance
- Sentiment trends

## 🎯 Priority Implementation Order

1. **HIGH PRIORITY** (Get basic functionality working):
   - Backend: ReputationController (stats, reviews list)
   - Frontend: Overview page with real data
   - Frontend: Reviews page with list and filters

2. **MEDIUM PRIORITY** (Core features):
   - Backend: ReviewRequestsController
   - Backend: AIAgentsController
   - Frontend: Requests page
   - Frontend: Settings page (AI Agents section)

3. **LOW PRIORITY** (Advanced features):
   - Backend: WidgetsController
   - Backend: BusinessListingsController
   - Frontend: Widgets page
   - Frontend: Listings page
   - Integration with external platforms

## 📊 Testing Checklist

- [ ] Database migration runs successfully
- [ ] All API endpoints return correct data
- [ ] Frontend pages load without errors
- [ ] Can create/read/update/delete reviews
- [ ] Can send review requests
- [ ] AI agents generate responses
- [ ] Widgets display correctly
- [ ] Settings save properly
- [ ] Cross-page navigation works
- [ ] Data flows between modules

## 🚀 Deployment Notes

1. Run migration: `php backend/scripts/run_reputation_migration.php`
2. Verify tables created
3. Test API endpoints
4. Test frontend pages
5. Configure integrations
6. Set up cron jobs for automated requests
