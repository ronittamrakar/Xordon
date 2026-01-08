# Website Builder - Quick Reference

## 🚀 Quick Start

```bash
# 1. Setup
cd backend && php setup_website_builder.php

# 2. Test
curl http://localhost:8001/api/websites \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Workspace-Id: 1"

# 3. Use
Navigate to http://localhost:5173/websites
```

## 📍 Key URLs

| Purpose | URL |
|---------|-----|
| Dashboard | `/websites` |
| Builder | `/websites/builder` |
| Builder (with type) | `/websites/builder?type=landing-page` |
| Edit Website | `/websites/builder/:id` |
| Landing Pages | `/websites/landing-pages` |
| Published Site | `/sites/:slug` |

## 🔌 API Quick Reference

```javascript
// Create Website
POST /api/websites
{
  "name": "My Website",
  "title": "My Website",
  "type": "landing-page",
  "content": {
    "sections": [],
    "settings": {...}
  }
}

// Update Website
PUT /api/websites/:id
{
  "content": {...}
}

// Publish
POST /api/websites/:id/publish

// Upload Media
POST /api/websites/:id/media
FormData: file

// Track Event
POST /api/websites/:id/track
{
  "event_type": "view",
  "event_data": {}
}
```

## 💾 Database Quick Ref

```sql
-- Get all websites
SELECT * FROM websites WHERE workspace_id = 1;

-- Get published websites
SELECT * FROM websites WHERE status = 'published';

-- Get website analytics
SELECT * FROM website_analytics WHERE website_id = 1;

-- Get media for website
SELECT * FROM website_media WHERE website_id = 1;
```

## 🎨 Element Types

**Layout**: container, section, columns, grid, divider, spacer, accordion, tabs  
**Content**: heading, text, paragraph, list, quote, code, table  
**Media**: image, gallery, video, audio, icon, icon-box, slider, carousel  
**Interactive**: button, form, input, textarea, select, checkbox, radio, search  
**Navigation**: header, navbar, menu, breadcrumb, pagination, footer, sidebar  
**Marketing**: hero, cta, features, benefits, pricing, testimonials, stats  
**E-Commerce**: product-grid, product-card, add-to-cart, cart, checkout  
**Business**: team, services, portfolio, case-studies, timeline, process  
**Blog**: blog-grid, blog-list, blog-post, blog-sidebar, categories  
**Social**: social-icons, social-feed, share-buttons  
**Advanced**: html, custom-code, embed, iframe, modal, animation  
**FAQ**: faq, faq-accordion, help-center  
**Comparison**: comparison-table, before-after, vs-section  

## 🌐 Website Types

1. `landing-page` - Campaign pages
2. `business` - Business sites
3. `ecommerce` - Online stores
4. `portfolio` - Creative work
5. `blog` - Content sites
6. `saas` - Software products
7. `restaurant` - Dining
8. `real-estate` - Properties
9. `education` - Learning
10. `healthcare` - Medical

## 🔧 Common Tasks

### Create Website from Code
```javascript
const website = await websitesApi.createWebsite({
  name: 'My Site',
  title: 'My Site',
  type: 'landing-page',
  content: {
    sections: [
      {
        id: nanoid(),
        type: 'hero',
        title: 'Welcome',
        subtitle: 'Get started',
        content: {
          ctaText: 'Click Here',
          ctaLink: '#contact'
        },
        styles: {
          backgroundColor: '#3b82f6',
          padding: '4rem 2rem',
          textAlign: 'center'
        }
      }
    ],
    settings: {
      seoTitle: 'My Site',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      accentColor: '#3b82f6'
    }
  }
});
```

### Upload Image
```javascript
const formData = new FormData();
formData.append('file', file);

const media = await fetch(`/api/websites/${websiteId}/media`, {
  method: 'POST',
  body: formData
});
```

### Publish Website
```javascript
await websitesApi.publishWebsite(websiteId);
```

## 📊 Analytics Events

```javascript
// Track page view
POST /api/websites/:id/track
{
  "event_type": "view",
  "event_data": {
    "page": "/",
    "referrer": "https://google.com"
  }
}

// Track conversion
POST /api/websites/:id/track
{
  "event_type": "conversion",
  "event_data": {
    "action": "form_submit",
    "value": 100
  }
}

// Track custom event
POST /api/websites/:id/track
{
  "event_type": "custom",
  "event_data": {
    "name": "button_click",
    "button_id": "cta-1"
  }
}
```

## 🔒 Security Checklist

- [ ] Workspace isolation enforced
- [ ] File upload validation active
- [ ] SQL injection prevention (prepared statements)
- [ ] XSS prevention (HTML escaping)
- [ ] File size limits configured
- [ ] Allowed file types whitelisted
- [ ] Upload directory permissions correct (755)

## ⚙️ Configuration

```env
# .env
APP_URL=https://yourdomain.com
UPLOAD_MAX_SIZE=10485760
```

```ini
# php.ini
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
```

## 🐛 Debug Commands

```bash
# Check database
mysql -u user -p database -e "SELECT COUNT(*) FROM websites;"

# Check uploads directory
ls -la backend/uploads/websites/

# Check permissions
stat backend/uploads/websites/

# Test API
curl -v http://localhost:8001/api/websites

# Check PHP errors
tail -f /var/log/php_errors.log
```

## 📁 File Structure

```
backend/
├── migrations/
│   └── create_websites_tables.sql
├── src/
│   └── controllers/
│       ├── WebsitesController.php
│       └── WebsiteMediaController.php
├── routes/
│   └── websites.php
├── views/
│   └── website-renderer.php
├── uploads/
│   └── websites/
│       └── {workspace_id}/
│           └── {website_id}/
└── setup_website_builder.php

src/
├── pages/
│   ├── Websites.tsx
│   └── WebsiteBuilder.tsx
├── components/
│   └── websites/
│       └── VisualWebsiteBuilder.tsx
├── lib/
│   └── websitesApi.ts
└── routes/
    └── WebsitesRoutes.tsx
```

## 🎯 Performance Tips

1. **Cache published websites** (Redis/Memcached)
2. **Use CDN for media files** (CloudFlare, AWS CloudFront)
3. **Optimize images** (WebP, compression)
4. **Enable gzip compression**
5. **Add database indexes** (already included)
6. **Lazy load images** in renderer
7. **Minify CSS/JS** for published sites

## 📞 Quick Help

| Issue | Solution |
|-------|----------|
| 500 Error | Check PHP logs, verify DB connection |
| Upload fails | Check permissions (755), PHP limits |
| Site not loading | Verify status='published', check slug |
| Images missing | Check web server config for /uploads/ |
| Slow performance | Add caching, optimize images, use CDN |

## 🎓 Learning Resources

- Frontend: `WEBSITE_BUILDER_IMPLEMENTATION.md`
- Backend: `BACKEND_IMPLEMENTATION_GUIDE.md`
- Complete: `COMPLETE_IMPLEMENTATION_SUMMARY.md`

---

**Quick Tip**: Use the setup script for instant deployment!
```bash
php backend/setup_website_builder.php
```
