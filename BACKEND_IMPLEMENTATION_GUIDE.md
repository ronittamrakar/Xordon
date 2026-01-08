# Website Builder Backend Implementation Guide

## Overview
This guide explains how to integrate the website builder backend into your existing application.

## Files Created

### 1. Database Migration
**File**: `backend/migrations/create_websites_tables.sql`
- Creates 7 tables for complete website management
- Run this migration to set up the database schema

### 2. Controllers
**File**: `backend/src/controllers/WebsitesController.php`
- Main controller for website CRUD operations
- Handles publishing, versioning, templates, and analytics

**File**: `backend/src/controllers/WebsiteMediaController.php`
- Handles file uploads and media management
- Supports images, videos, audio, and documents

### 3. Routes
**File**: `backend/routes/websites.php`
- Defines all API endpoints for the website builder
- Includes routes for CRUD, publishing, templates, media, and analytics

### 4. Views
**File**: `backend/views/website-renderer.php`
- Renders published websites from JSON content
- Includes SEO, analytics, and responsive design

## Installation Steps

### Step 1: Run Database Migration

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database < backend/migrations/create_websites_tables.sql
```

Or use your existing migration system:
```php
// In your migration runner
$sql = file_get_contents(__DIR__ . '/migrations/create_websites_tables.sql');
$db->exec($sql);
```

### Step 2: Include Routes

Add the websites routes to your main router file (e.g., `backend/public/index.php`):

```php
// Include website routes
require __DIR__ . '/../routes/websites.php';
```

### Step 3: Configure Upload Directory

Ensure the upload directory exists and is writable:

```bash
mkdir -p backend/uploads/websites
chmod 755 backend/uploads/websites
```

Update your `.env` file:
```env
APP_URL=https://yourdomain.com
UPLOAD_MAX_SIZE=10485760  # 10MB in bytes
```

### Step 4: Configure Web Server

Add this to your `.htaccess` or nginx config to serve uploaded files:

**Apache (.htaccess)**:
```apache
# Serve uploaded files
RewriteRule ^uploads/(.*)$ backend/uploads/$1 [L]
```

**Nginx**:
```nginx
location /uploads/ {
    alias /path/to/backend/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Step 5: Test the API

Test that the endpoints are working:

```bash
# Get all websites
curl -X GET http://localhost:8001/api/websites \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Workspace-Id: 1"

# Create a website
curl -X POST http://localhost:8001/api/websites \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Workspace-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Website",
    "title": "My Test Website",
    "type": "landing-page",
    "content": {
      "sections": [],
      "settings": {
        "seoTitle": "Test Website",
        "backgroundColor": "#ffffff",
        "fontFamily": "Inter, sans-serif",
        "accentColor": "#3b82f6"
      }
    }
  }'
```

## API Endpoints Reference

### Websites CRUD
- `GET /api/websites` - List all websites
- `GET /api/websites/:id` - Get single website
- `POST /api/websites` - Create new website
- `PUT /api/websites/:id` - Update website
- `DELETE /api/websites/:id` - Delete website

### Publishing
- `POST /api/websites/:id/publish` - Publish website
- `POST /api/websites/:id/unpublish` - Unpublish website
- `POST /api/websites/:id/duplicate` - Duplicate website

### Templates
- `GET /api/websites/templates` - Get all templates
- `GET /api/websites/templates?type=landing-page` - Get templates by type
- `POST /api/websites/templates/:id/create` - Create from template

### Media
- `POST /api/websites/:id/media` - Upload media (multipart/form-data)
- `GET /api/websites/:id/media` - Get all media for website
- `DELETE /api/websites/media/:id` - Delete media

### Analytics
- `POST /api/websites/:id/track` - Track analytics event

### Public
- `GET /sites/:slug` - View published website

## Database Schema

### Main Tables

#### `websites`
- Stores website metadata and content
- Content is stored as JSON
- Supports soft deletes

#### `website_versions`
- Version control for websites
- Tracks all changes with descriptions

#### `website_templates`
- Pre-built templates
- Can be filtered by type and category

#### `website_media`
- Uploaded files and images
- Tracks dimensions for images

#### `website_analytics`
- Tracks views, conversions, and custom events
- Stores visitor information

#### `website_domains`
- Custom domain management
- SSL certificate storage

#### `website_form_submissions`
- Form submissions from published websites

## Security Considerations

### 1. File Upload Security
- File type validation (whitelist)
- File size limits (10MB default)
- Extension validation
- Workspace isolation

### 2. Access Control
- All endpoints require workspace context
- Users can only access websites in their workspace
- Soft deletes prevent data loss

### 3. SQL Injection Prevention
- All queries use prepared statements
- Input validation on all endpoints

### 4. XSS Prevention
- All output is HTML-escaped in renderer
- User content is sanitized

## Performance Optimization

### 1. Database Indexes
- Indexes on workspace_id, user_id, slug, type, status
- Composite index on workspace_id + slug for uniqueness

### 2. Caching
Consider adding caching for:
- Published websites (Redis/Memcached)
- Templates list
- Media files (CDN)

### 3. File Storage
Consider using cloud storage for production:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

## Monitoring

### Track These Metrics
- Website creation rate
- Publish success rate
- Media upload success rate
- Page load times for published sites
- Analytics events

### Logging
Log these events:
- Website creation/updates
- Publishing events
- Media uploads
- Errors and exceptions

## Troubleshooting

### Issue: "Workspace context required"
**Solution**: Ensure the tenant middleware is setting the workspace context properly.

### Issue: File upload fails
**Solution**: 
- Check directory permissions (755 for directories, 644 for files)
- Verify upload_max_filesize in php.ini
- Check post_max_size in php.ini

### Issue: Published website not loading
**Solution**:
- Verify website status is 'published'
- Check slug is correct
- Ensure renderer file exists

### Issue: Images not displaying
**Solution**:
- Verify file URLs are correct
- Check web server configuration for /uploads/ path
- Ensure files were uploaded successfully

## Next Steps

### 1. Add More Element Renderers
Extend `website-renderer.php` to support all 100+ element types from the builder.

### 2. Implement Custom Domains
- DNS verification
- SSL certificate generation (Let's Encrypt)
- Domain routing

### 3. Add A/B Testing
- Create variant versions
- Track conversion rates
- Automatic winner selection

### 4. Implement SEO Tools
- Meta tag generator
- Sitemap generation
- robots.txt management
- Schema.org markup

### 5. Add Export Functionality
- Export to HTML/CSS
- Export to WordPress
- Export to other platforms

### 6. Implement Collaboration
- Real-time editing (WebSockets)
- Comments and annotations
- Change tracking
- User permissions

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API endpoint reference
3. Check server logs for errors
4. Verify database schema is correct

## Version History

- **v1.0.0** (2025-12-28): Initial implementation
  - Basic CRUD operations
  - Publishing system
  - Media uploads
  - Template system
  - Analytics tracking
  - Website renderer
