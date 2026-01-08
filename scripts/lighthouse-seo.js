/**
 * Lighthouse SEO Checker
 * 
 * Runs Lighthouse audits on specified URLs and reports SEO score
 * 
 * Usage:
 *   npm run seo:check              - Check /marketing/seo page
 *   npm run seo:check -- --url=/   - Check specific URL
 *   npm run seo:check -- --ci      - Run in CI mode (fails if score < threshold)
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DEFAULT_URL = 'http://localhost:5173/marketing/seo';
const SEO_THRESHOLD = 80; // Minimum acceptable SEO score
const REPORT_DIR = join(__dirname, '..', 'lighthouse-reports');

// Parse command line arguments
const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));
const ciMode = args.includes('--ci');
const targetUrl = urlArg ? urlArg.split('=')[1] : DEFAULT_URL;

// Ensure URL is absolute
const url = targetUrl.startsWith('http') ? targetUrl : `http://localhost:5173${targetUrl}`;

/**
 * Run Lighthouse audit
 */
async function runLighthouse() {
  console.log('🔍 Starting Lighthouse SEO audit...');
  console.log(`   URL: ${url}`);
  console.log('');

  let chrome;
  
  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
    });

    // Run Lighthouse
    const options = {
      logLevel: 'error',
      output: 'html',
      onlyCategories: ['seo', 'performance', 'accessibility', 'best-practices'],
      port: chrome.port
    };

    const runnerResult = await lighthouse(url, options);

    // Extract scores
    const { lhr } = runnerResult;
    const seoScore = lhr.categories.seo.score * 100;
    const perfScore = lhr.categories.performance.score * 100;
    const a11yScore = lhr.categories.accessibility.score * 100;
    const bpScore = lhr.categories['best-practices'].score * 100;

    // Display results
    console.log('📊 Lighthouse Results:');
    console.log('');
    console.log(`   SEO:             ${formatScore(seoScore)}`);
    console.log(`   Performance:     ${formatScore(perfScore)}`);
    console.log(`   Accessibility:   ${formatScore(a11yScore)}`);
    console.log(`   Best Practices:  ${formatScore(bpScore)}`);
    console.log('');

    // SEO-specific audits
    const seoAudits = lhr.categories.seo.auditRefs;
    const failedAudits = seoAudits.filter(audit => {
      const auditResult = lhr.audits[audit.id];
      return auditResult.score !== null && auditResult.score < 1;
    });

    if (failedAudits.length > 0) {
      console.log('⚠️  SEO Issues Found:');
      failedAudits.forEach(audit => {
        const auditResult = lhr.audits[audit.id];
        console.log(`   • ${auditResult.title}`);
        if (auditResult.description) {
          console.log(`     ${auditResult.description.substring(0, 100)}...`);
        }
      });
      console.log('');
    }

    // Save HTML report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(REPORT_DIR, `lighthouse-${timestamp}.html`);
    
    // Create reports directory if it doesn't exist
    const fs = await import('fs');
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }
    
    writeFileSync(reportPath, runnerResult.report);
    console.log(`📄 Full report saved: ${reportPath}`);
    console.log('');

    // CI mode: fail if below threshold
    if (ciMode) {
      if (seoScore < SEO_THRESHOLD) {
        console.error(`❌ SEO score (${seoScore}) is below threshold (${SEO_THRESHOLD})`);
        process.exit(1);
      }
      console.log(`✅ SEO score meets threshold (${SEO_THRESHOLD})`);
    } else {
      if (seoScore >= 90) {
        console.log('✅ Excellent SEO score!');
      } else if (seoScore >= SEO_THRESHOLD) {
        console.log('✅ Good SEO score!');
      } else {
        console.log(`⚠️  SEO score is below recommended threshold (${SEO_THRESHOLD})`);
      }
    }

  } catch (error) {
    console.error('❌ Lighthouse audit failed:', error.message);
    process.exit(1);
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

/**
 * Format score with color indicator
 */
function formatScore(score) {
  const rounded = Math.round(score);
  if (rounded >= 90) return `${rounded} 🟢`;
  if (rounded >= 70) return `${rounded} 🟡`;
  return `${rounded} 🔴`;
}

// Run the audit
runLighthouse();
