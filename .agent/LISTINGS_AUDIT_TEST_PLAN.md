# Listings Audit Page - Test & Verification Plan

## URL
`http://localhost:5173/marketing/listings?id=1&tab=audit`

## Overview
The Listings Audit tab provides comprehensive citation analysis with NAP consistency checking, duplicate detection, scoring, and recommendations.

## Components Verified

### 1. **Frontend Component**
- **Location**: `src/components/CitationAudit.tsx`
- **Status**: ✅ Exists and properly implemented
- **Features**:
  - NAP (Name, Address, Phone) consistency analysis
  - Issue detection and categorization
  - Duplicate listing detection
  - Health scoring system
  - Export functionality
  - Audit history tracking

### 2. **API Integration**
- **Service**: `src/services/listingsApi.ts`
- **Endpoints**:
  - `GET /listings/audits` - Fetch audit history
  - `POST /listings/audits` - Start new audit
  - `GET /listings/duplicates` - Get duplicate listings
  - `POST /listings/duplicates/:id/suppress` - Suppress a duplicate

### 3. **Backend Routes**
- **File**: `backend/public/index.php`
- **Routes** (Lines 2939-2942):
  ```php
  if ($path === '/listings/audits' && $method === 'GET') return ListingsController::getAudits();
  if ($path === '/listings/audits' && $method === 'POST') return ListingsController::startAudit();
  if ($path === '/listings/duplicates' && $method === 'GET') return ListingsController::getDuplicates();
  if (preg_match('#^/listings/duplicates/(\\d+)/suppress$#', $path, $m) && $method === 'POST') return ListingsController::suppressDuplicate((int)$m[1]);
  ```
- **Status**: ✅ All routes properly defined

### 4. **Backend Controller**
- **File**: `backend/src/controllers/ListingsController.php`
- **Methods**:
  - `getAudits()` - Returns all audits for company
  - `startAudit()` - Creates new audit and schedules background job
  - `getDuplicates()` - Returns duplicate listings
  - `suppressDuplicate($id)` - Marks duplicate as suppressed
- **Status**: ✅ All methods implemented

### 5. **Database Tables**
- **Tables**:
  - `listing_audits` - Stores audit runs and results
  - `listing_duplicates` - Stores detected duplicate listings
- **Status**: ✅ Both tables exist in database

## Tab Structure

The Citation Audit tab contains 5 sub-tabs:

### 1. Overview Tab
**Purpose**: High-level summary of citation health

**Features**:
- Overall health score (0-100)
- NAP consistency score
- Issues count (with critical/warning breakdown)
- Coverage metrics (verified/claimed listings)
- Citation performance stats
- Top recommendations

**Data Sources**:
- Calculated from `listings` prop
- `settings` for master NAP data
- `audits` from API
- `duplicates` from API

### 2. NAP Analysis Tab
**Purpose**: Detailed Name, Address, Phone consistency analysis

**Features**:
- Master business information display
- Match/mismatch counts for each field
- Variation detection and listing
- Visual breakdown by field

**Calculations**:
- Compares each listing against master settings
- Normalizes data for comparison
- Tracks all variations found

### 3. Issues Tab
**Purpose**: Comprehensive list of all detected issues

**Features**:
- Issue categorization (error/warning/info)
- Priority levels (high/medium/low)
- Affected listings count
- Actionable suggestions
- Bulk selection for fixes

**Issue Categories**:
- `nap` - NAP inconsistencies
- `duplicate` - Duplicate listings
- `missing` - Missing information
- `outdated` - Needs update
- `incomplete` - Unverified or incomplete

### 4. Duplicates Tab
**Purpose**: Manage duplicate listing detection

**Features**:
- List of potential duplicates
- Similarity scores
- Suppress/remove actions
- Affected platforms

**Data Source**:
- `listing_duplicates` table via API

### 5. History Tab
**Purpose**: Track audit runs over time

**Features**:
- Audit run history
- Score trends
- Previous reports
- Comparison over time

**Data Source**:
- `listing_audits` table via API

## Action Buttons

### Settings Button
- Opens audit configuration dialog
- Options:
  - Scan depth (quick/standard/deep)
  - Check duplicates
  - Check NAP
  - Check categories
  - Check hours
  - Check photos
  - Auto-fix option

### Export Button
- Exports comprehensive audit report
- Format: JSON
- Includes:
  - Health scores
  - NAP analysis
  - All issues with suggestions
  - Variations detected
  - Timestamp

### Run Audit Button
- Triggers new audit scan
- Creates entry in `listing_audits` table
- Schedules background job for processing
- Updates UI with progress
- Refreshes data on completion

## Data Flow

```
1. User clicks "Run Audit"
   ↓
2. Frontend calls POST /listings/audits
   ↓
3. Backend creates audit record (status: pending)
   ↓
4. Background job scheduled for processing
   ↓
5. Job scans all listings for issues
   ↓
6. Results saved to listing_audits.report_data
   ↓
7. Frontend polls or receives update
   ↓
8. UI displays results in all tabs
```

## Testing Checklist

### Pre-requisites
- [ ] Company selected (id=1 in URL)
- [ ] At least one business listing exists
- [ ] Business profile settings configured (NAP data)

### Overview Tab
- [ ] Health score displays correctly
- [ ] NAP consistency percentage shows
- [ ] Issues count is accurate
- [ ] Coverage metrics display
- [ ] Top recommendations appear
- [ ] Clicking recommendation navigates to Issues tab

### NAP Analysis Tab
- [ ] Master business info displays
- [ ] Name match/mismatch counts correct
- [ ] Address variations listed
- [ ] Phone variations shown
- [ ] Visual breakdown renders

### Issues Tab
- [ ] All issues listed
- [ ] Correct icons for error/warning/info
- [ ] Priority badges display
- [ ] Affected listings count accurate
- [ ] Suggestions are actionable
- [ ] Checkbox selection works
- [ ] "Fix Selected" button appears when items selected

### Duplicates Tab
- [ ] Duplicate listings display (if any)
- [ ] Similarity scores shown
- [ ] Suppress action works
- [ ] UI updates after suppression

### History Tab
- [ ] Previous audits listed
- [ ] Scores display for each run
- [ ] Timestamps correct
- [ ] Can view historical reports

### Action Buttons
- [ ] Settings dialog opens
- [ ] Settings can be modified
- [ ] Export downloads JSON file
- [ ] Run Audit creates new audit
- [ ] Loading states display correctly
- [ ] Success/error toasts appear

## Known Dependencies

### Props Required
```typescript
{
  activeCompanyId: number | string | null;
  listings: BusinessListing[];
  settings?: ListingSettings;
  onNavigateToListings?: () => void;
  onEditListing?: (listing: BusinessListing) => void;
}
```

### API Queries
- `listing-audits` - Fetches audit history
- `listing-duplicates` - Fetches duplicates
- `business-listings` - Listings data (passed as prop)
- `listing-settings` - Business profile settings (passed as prop)

## Troubleshooting

### No data showing
1. Check if company ID is in URL
2. Verify listings exist for company
3. Check browser console for API errors
4. Verify backend routes are accessible

### Audit not running
1. Check if audit was created in database
2. Verify background job service is running
3. Check job queue for errors
4. Review backend logs

### Scores showing 0
1. Verify listings have data
2. Check if settings have NAP data
3. Ensure listings belong to active company

### Duplicates not detected
1. Run audit first
2. Check if duplicate detection is enabled in settings
3. Verify sufficient listings exist for comparison

## Success Criteria

✅ **All tabs render without errors**
✅ **Data displays correctly in each section**
✅ **Action buttons function as expected**
✅ **API calls succeed**
✅ **Scores calculate accurately**
✅ **Issues are detected and categorized**
✅ **Export generates valid JSON**
✅ **Audit runs complete successfully**

## Next Steps

If any issues are found:
1. Check browser console for errors
2. Review network tab for failed API calls
3. Verify database tables have correct schema
4. Check backend logs for errors
5. Ensure all dependencies are installed
6. Verify environment variables are set correctly
