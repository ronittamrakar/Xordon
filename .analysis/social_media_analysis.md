# Social Media Marketing Page Analysis & Implementation Plan

## Current State Assessment

### ✅ What We Have:
1. **Frontend Components**:
   - `SocialScheduler.tsx` - Full-featured social media scheduler with:
     - Post creation with multi-platform support
     - Calendar view
     - Templates management
     - Hashtag groups
     - Analytics dashboard
     - Connected accounts management
   - `SocialCalendar.tsx` - Calendar component for visualizing scheduled posts
   - `PostPreview.tsx` - Live preview component for different platforms
   
2. **Frontend API Service**:
   - `socialApi.ts` - Complete API client with methods for:
     - Accounts management
     - Posts CRUD
     - Templates
     - Hashtag groups
     - Analytics
     - Categories

3. **Backend Controller**:
   - `SocialController.php` - Fully implemented with all endpoints:
     - Social accounts management
     - Posts CRUD with scheduling
     - Publishing functionality
     - Templates management
     - Hashtag groups
     - Categories
     - Analytics

4. **Database Schema**:
   - Migration files exist for all required tables:
     - `social_accounts`
     - `social_posts`
     - `social_post_analytics`
     - `social_categories`
     - `social_templates`
     - `hashtag_groups`
     - `social_best_times`

5. **Routing**:
   - Frontend route configured: `/marketing/social` → `SocialScheduler`
   - Sidebar navigation configured

### ❌ What's Missing/Broken:

1. **Backend Routes NOT Registered**:
   - No routes in `backend/public/index.php` for `/social/*` endpoints
   - Frontend API calls will return 404 errors

2. **Database Tables May Not Exist**:
   - Migrations may not have been run
   - `company_id` column may be missing (company scoping migration)

3. **OAuth Integration**:
   - Social platform OAuth flows not implemented (Facebook, Instagram, Twitter, LinkedIn, etc.)
   - Currently shows placeholder "OAuth flow would start here" messages

4. **Publishing Integration**:
   - Actual platform API publishing not implemented
   - Currently simulates publishing with mock data

## Implementation Tasks

### Priority 1: Make Basic Functionality Work

#### Task 1.1: Register Backend Routes
**File**: `backend/public/index.php`
**Location**: After messaging channels routes (around line 3500)
**Routes to add**:
```php
// ==================== SOCIAL MEDIA SCHEDULER ROUTES ====================
// Accounts
if ($path === '/social/accounts' && $method === 'GET') return SocialController::getAccounts();
if (preg_match('#^/social/accounts/(\d+)/disconnect$#', $path, $m) && $method === 'POST') {
    return SocialController::disconnectAccount((int)$m[1]);
}

// Posts
if ($path === '/social/posts' && $method === 'GET') return SocialController::getPosts();
if ($path === '/social/posts' && $method === 'POST') return SocialController::createPost();
if (preg_match('#^/social/posts/(\d+)$#', $path, $m)) {
    $id = (int)$m[1];
    if ($method === 'GET') return SocialController::getPost($id);
    if ($method === 'PUT' || $method === 'PATCH') return SocialController::updatePost($id);
    if ($method === 'DELETE') return SocialController::deletePost($id);
}
if (preg_match('#^/social/posts/(\d+)/publish$#', $path, $m) && $method === 'POST') {
    return SocialController::publishPost((int)$m[1]);
}

// Templates
if ($path === '/social/templates' && $method === 'GET') return SocialController::getTemplates();
if ($path === '/social/templates' && $method === 'POST') return SocialController::createTemplate();

// Hashtag Groups
if ($path === '/social/hashtag-groups' && $method === 'GET') return SocialController::getHashtagGroups();
if ($path === '/social/hashtag-groups' && $method === 'POST') return SocialController::createHashtagGroup();

// Categories
if ($path === '/social/categories' && $method === 'GET') return SocialController::getCategories();
if ($path === '/social/categories' && $method === 'POST') return SocialController::createCategory();

// Analytics
if ($path === '/social/analytics' && $method === 'GET') return SocialController::getAnalytics();
```

#### Task 1.2: Verify/Create Database Tables
**Action**: Run migrations to ensure all tables exist with proper schema
**Files**:
- `backend/migrations/social_scheduler.sql`
- `backend/migrations/growth_company_scoping.sql` (adds company_id columns)

#### Task 1.3: Seed Demo Data (Optional)
**File**: `backend/migrations/seed_growth_suite_demo.sql`
**Purpose**: Add sample social accounts and posts for testing

### Priority 2: Enhanced Features

#### Task 2.1: OAuth Integration
**Platforms to integrate**:
- Facebook/Instagram (Meta Business Suite)
- Twitter/X
- LinkedIn
- TikTok
- YouTube
- Pinterest

**Implementation**:
- Create OAuth callback handlers
- Store encrypted tokens
- Handle token refresh
- Implement account connection UI

#### Task 2.2: Platform Publishing
**Implement actual API calls to**:
- Facebook Graph API
- Instagram Graph API
- Twitter API v2
- LinkedIn API
- TikTok API
- YouTube Data API

#### Task 2.3: Analytics Sync
**Implement**:
- Periodic sync of post analytics from platforms
- Store in `social_post_analytics` table
- Display real engagement metrics

### Priority 3: Advanced Features

#### Task 3.1: AI Content Generation
- Integrate with AI service for caption generation
- Platform-specific optimization
- Hashtag suggestions

#### Task 3.2: Best Time to Post
- Analyze historical engagement data
- Populate `social_best_times` table
- Suggest optimal posting times

#### Task 3.3: Media Library Integration
- Connect to existing media library
- Allow selecting images/videos from library
- Upload directly to social platforms

## Testing Checklist

### Basic Functionality:
- [ ] Page loads without errors
- [ ] Can create a draft post
- [ ] Can schedule a post for future
- [ ] Can view posts in calendar
- [ ] Can create templates
- [ ] Can create hashtag groups
- [ ] Can delete posts
- [ ] Analytics dashboard displays (even with mock data)

### Account Management:
- [ ] Can view connected accounts (or empty state)
- [ ] Connect account button shows platforms
- [ ] Disconnect account works

### Post Creation:
- [ ] Can select multiple accounts
- [ ] Can add media (mock)
- [ ] Can use templates
- [ ] Can add hashtags from groups
- [ ] Preview shows correctly for each platform
- [ ] Character counter works
- [ ] Scheduling calendar works
- [ ] "Best Time" suggestion works

### Calendar View:
- [ ] Shows scheduled posts
- [ ] Can navigate months
- [ ] Can click on posts
- [ ] Shows correct post count

## Current Issues to Fix

1. **404 Errors**: All `/social/*` API calls failing
2. **Empty Data**: No accounts or posts to display
3. **OAuth Placeholders**: Connection flow not functional
4. **Publishing**: Only simulated, not real

## Recommended Immediate Actions

1. ✅ Add backend routes to index.php
2. ✅ Run database migrations
3. ✅ Test basic CRUD operations
4. ⏳ Add demo data for testing
5. ⏳ Implement OAuth for at least one platform (Facebook recommended)
6. ⏳ Test end-to-end post creation and scheduling

## Notes

- The frontend UI is well-designed and feature-complete
- Backend controller is fully implemented
- Main blocker is missing route registration
- Once routes are added, basic functionality should work immediately
- OAuth and real publishing are nice-to-have enhancements
