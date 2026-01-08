/**
 * Sitemap Generator for Xordon
 * 
 * Generates sitemap.xml for public pages
 * Run: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DOMAIN = process.env.VITE_APP_URL || 'https://xordon.com';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

// Public routes to include in sitemap
// Add new public routes here as they are created
const publicRoutes = [
  {
    path: '/',
    priority: 1.0,
    changefreq: 'daily',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/marketing/seo',
    priority: 0.8,
    changefreq: 'weekly',
    lastmod: new Date().toISOString().split('T')[0]
  },
  // Add more public routes here:
  // { path: '/about', priority: 0.8, changefreq: 'monthly', lastmod: '2025-12-24' },
  // { path: '/pricing', priority: 0.9, changefreq: 'weekly', lastmod: '2025-12-24' },
  // { path: '/features', priority: 0.9, changefreq: 'weekly', lastmod: '2025-12-24' },
];

/**
 * Generate XML sitemap content
 */
function generateSitemap(routes) {
  const urls = routes.map(route => {
    const url = `${DOMAIN}${route.path}`;
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Main execution
 */
function main() {
  console.log('🗺️  Generating sitemap...');
  
  try {
    const sitemap = generateSitemap(publicRoutes);
    
    // Ensure public directory exists
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write sitemap file
    fs.writeFileSync(OUTPUT_PATH, sitemap, 'utf-8');
    
    console.log(`✅ Sitemap generated successfully!`);
    console.log(`   Location: ${OUTPUT_PATH}`);
    console.log(`   URLs: ${publicRoutes.length}`);
    console.log(`   Domain: ${DOMAIN}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Update public/robots.txt to reference sitemap');
    console.log('   2. Add this script to your build process');
    console.log('   3. Submit sitemap to Google Search Console');
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

main();
