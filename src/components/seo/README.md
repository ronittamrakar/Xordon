# SEO Components — Usage Guide

This directory contains reusable SEO components and utilities for the Xordon platform.

## SeoHead Component

The `SeoHead` component is a reusable React component that manages all SEO-related metadata for a page.

### Features
- ✅ Document title
- ✅ Meta description
- ✅ Canonical URL
- ✅ Open Graph tags (Facebook, LinkedIn)
- ✅ Twitter Card tags
- ✅ JSON-LD structured data
- ✅ Robots directive (noindex support)

### Basic Usage

```tsx
import { SeoHead } from '@/components/seo/SeoHead';

function MyPage() {
  return (
    <>
      <SeoHead
        title="My Page Title — Xordon"
        description="A brief description of my page for search engines."
        canonical="https://xordon.com/my-page"
      />
      
      <div>
        {/* Your page content */}
      </div>
    </>
  );
}
```

### Full Example with All Options

```tsx
import { SeoHead } from '@/components/seo/SeoHead';

function ProductPage() {
  return (
    <>
      <SeoHead
        title="SEO Toolkit — Track Keywords & Rankings | Xordon"
        description="Comprehensive SEO toolkit for keyword research, rank tracking, backlink monitoring, and technical audits."
        canonical="https://xordon.com/marketing/seo"
        
        // Open Graph (Facebook, LinkedIn)
        ogTitle="SEO Toolkit — Xordon Business OS"
        ogDescription="Track keyword rankings, monitor backlinks, and run technical audits."
        ogImage="https://xordon.com/og-seo-toolkit.png"
        ogType="website"
        
        // Twitter Card
        twitterCard="summary_large_image"
        twitterSite="@xordon"
        twitterCreator="@xordon"
        
        // Structured Data (JSON-LD)
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "SEO Toolkit",
          "description": "Comprehensive SEO toolkit",
          "url": "https://xordon.com/marketing/seo",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Marketing",
                "item": "https://xordon.com/marketing"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "SEO",
                "item": "https://xordon.com/marketing/seo"
              }
            ]
          }
        }}
      />
      
      <div>{/* Page content */}</div>
    </>
  );
}
```

### Admin Pages (noindex)

For authenticated admin pages that should not be indexed:

```tsx
<SeoHead
  title="Admin Dashboard — Xordon"
  description="Internal admin dashboard"
  noindex={true}
/>
```

This adds `<meta name="robots" content="noindex, nofollow">` to prevent search engines from indexing the page.

### Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | ✅ Yes | Page title (appears in browser tab and search results) |
| `description` | `string` | ✅ Yes | Meta description (appears in search results) |
| `canonical` | `string` | ⚪ Optional | Canonical URL (prevents duplicate content issues) |
| `ogTitle` | `string` | ⚪ Optional | Open Graph title (defaults to `title`) |
| `ogDescription` | `string` | ⚪ Optional | Open Graph description (defaults to `description`) |
| `ogImage` | `string` | ⚪ Optional | Open Graph image URL (1200x630px recommended) |
| `ogType` | `string` | ⚪ Optional | Open Graph type (default: `"website"`) |
| `twitterCard` | `string` | ⚪ Optional | Twitter card type (default: `"summary_large_image"`) |
| `twitterSite` | `string` | ⚪ Optional | Twitter site handle (e.g., `"@xordon"`) |
| `twitterCreator` | `string` | ⚪ Optional | Twitter creator handle |
| `jsonLd` | `object` | ⚪ Optional | JSON-LD structured data object |
| `noindex` | `boolean` | ⚪ Optional | Prevent indexing (default: `false`) |

### JSON-LD Examples

#### WebPage
```tsx
jsonLd={{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Page Name",
  "description": "Page description",
  "url": "https://example.com/page"
}}
```

#### Article
```tsx
jsonLd={{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "description": "Article description",
  "image": "https://example.com/image.jpg",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "datePublished": "2025-12-24",
  "publisher": {
    "@type": "Organization",
    "name": "Xordon",
    "logo": "https://example.com/logo.png"
  }
}}
```

#### Product
```tsx
jsonLd={{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "description": "Product description",
  "image": "https://example.com/product.jpg",
  "offers": {
    "@type": "Offer",
    "price": "99.00",
    "priceCurrency": "USD"
  }
}}
```

### Best Practices

1. **Title Length:** Keep titles under 60 characters for optimal display in search results
2. **Description Length:** Keep descriptions between 150-160 characters
3. **Canonical URLs:** Always use absolute URLs (include protocol and domain)
4. **OG Images:** Use 1200x630px images for best display on social media
5. **Unique Content:** Every page should have unique title and description
6. **JSON-LD Validation:** Test with [Google Rich Results Test](https://search.google.com/test/rich-results)

### Testing

Test your SEO tags:
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Facebook Sharing Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **Local Lighthouse:** `npm run seo:check`

### Common Issues

**Issue:** Meta tags not appearing in page source  
**Solution:** This is normal for client-side rendered pages. Search engines execute JavaScript and will see the tags. For better crawlability, consider prerendering or SSR.

**Issue:** OG image not showing on social media  
**Solution:** Use absolute URLs, ensure image is publicly accessible, and clear social media cache using their debug tools.

**Issue:** Duplicate title tags  
**Solution:** Remove any static `<title>` tag from `index.html` and let `SeoHead` manage it.

---

For more information, see [SEO_IMPLEMENTATION_COMPLETE.md](../../SEO_IMPLEMENTATION_COMPLETE.md)
