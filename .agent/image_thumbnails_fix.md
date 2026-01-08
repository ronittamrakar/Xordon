# Image Thumbnails Fix

## Issue
Image thumbnails were not displaying in the FileUploader component when viewing existing files (logo, cover photo, and gallery images) in the Business Profile section of the Listings page.

## Root Causes

### 1. Missing Proxy Configuration
The Vite development server was not configured to proxy `/uploads` requests to the backend server, causing uploaded images to fail to load.

### 2. Incomplete FileItem Mock Objects
The `existingFiles` prop in ListingSettings.tsx was creating incomplete mock FileItem objects using `as any` type casting, which bypassed TypeScript checks but resulted in missing required fields that the FileUploader component needed to properly display images.

### 3. Missing URL Fallback
The FileUploader component only checked for `file.url` but didn't fall back to `file.public_url`, which is also a valid field in the FileItem interface.

## Changes Made

### 1. Vite Configuration (`vite.config.ts`)
Added proxy configuration for `/uploads` path:
```typescript
'/uploads': {
  target: 'http://127.0.0.1:8001',
  changeOrigin: true,
  secure: false,
}
```

### 2. Backend Router Scripts
Updated both `backend/server.php` and `backend/router.php` to serve static files from the `uploads` directory:
```php
// Also check the uploads directory
if (strpos($uri, '/uploads/') === 0 && file_exists(__DIR__ . $uri)) {
    error_log("Serving static file from uploads: $uri");
    return false;
}
```

### 3. FileUploader Component (`src/components/FileUploader.tsx`)
- Added fallback to `file.public_url` when `file.url` is not available
- Added error handling for failed image loads with a graceful fallback to icon display
- Improved image display logic to check both URL fields

### 4. ListingSettings Component (`src/components/ListingSettings.tsx`)
Replaced incomplete mock FileItem objects with complete ones containing all required fields:
- `workspace_id`, `company_id`, `user_id`
- `filename`, `storage_path`, `storage_provider`
- `folder`, `category`, `entity_type`, `entity_id`
- `metadata`, `alt_text`, `description`
- `is_public`, `is_archived`
- `created_at`, `updated_at`
- Both `url` and `public_url` fields

This ensures proper TypeScript type checking and provides all data the FileUploader component expects.

## Testing
After these changes:
1. Existing logo images should display correctly
2. Existing cover photos should display correctly
3. Existing gallery images should display correctly
4. Newly uploaded images should display immediately
5. Image removal should work properly
6. No TypeScript errors related to FileItem interface

## Files Modified
1. `vite.config.ts` - Added /uploads proxy
2. `backend/server.php` - Added uploads directory serving
3. `backend/router.php` - Added uploads directory serving
4. `src/components/FileUploader.tsx` - Improved URL handling and error handling
5. `src/components/ListingSettings.tsx` - Fixed FileItem mock objects
