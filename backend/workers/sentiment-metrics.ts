/**
 * Sentiment Metrics Worker
 * Runs periodically to calculate and aggregate metrics
 */

import { SentimentTelemetryService } from '../services/sentiment/TelemetryService';
import { db } from '../src/Database';

const telemetryService = new SentimentTelemetryService();

/**
 * Run daily metrics calculation
 */
async function calculateDailyMetrics() {
  console.log('[SentimentWorker] Running daily metrics calculation...');

  try {
    // Get all active configs
    const configs = await db.query(
      'SELECT id FROM sentiment_configs WHERE enabled = TRUE AND deleted_at IS NULL'
    );

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    for (const config of configs) {
      try {
        await telemetryService.calculateDailyMetrics(config.id, yesterday);
        console.log(`[SentimentWorker] Calculated metrics for config ${config.id}`);
      } catch (error) {
        console.error(`[SentimentWorker] Error calculating metrics for config ${config.id}:`, error);
      }
    }

    console.log('[SentimentWorker] Daily metrics calculation complete');
  } catch (error) {
    console.error('[SentimentWorker] Daily metrics calculation failed:', error);
  }
}

/**
 * Run drift detection
 */
async function runDriftDetection() {
  console.log('[SentimentWorker] Running drift detection...');

  try {
    // Get configs with drift detection enabled
    const configs = await db.query(
      `SELECT id FROM sentiment_configs 
       WHERE enabled = TRUE 
       AND deleted_at IS NULL 
       AND JSON_EXTRACT(drift_detection_config, '$.enabled') = TRUE`
    );

    for (const config of configs) {
      try {
        const result = await telemetryService.detectDrift(config.id);
        if (result.hasDrift) {
          console.warn(`[SentimentWorker] Drift detected for config ${config.id}: ${result.driftScore.toFixed(4)}`);
        }
      } catch (error) {
        console.error(`[SentimentWorker] Error detecting drift for config ${config.id}:`, error);
      }
    }

    console.log('[SentimentWorker] Drift detection complete');
  } catch (error) {
    console.error('[SentimentWorker] Drift detection failed:', error);
  }
}

/**
 * Main worker loop
 */
async function run() {
  console.log('[SentimentWorker] Starting sentiment metrics worker...');

  // Run daily metrics at midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - now.getTime();

  setTimeout(() => {
    calculateDailyMetrics();
    setInterval(calculateDailyMetrics, 24 * 60 * 60 * 1000); // Every 24 hours
  }, msUntilMidnight);

  // Run drift detection every 6 hours
  runDriftDetection();
  setInterval(runDriftDetection, 6 * 60 * 60 * 1000);

  console.log('[SentimentWorker] Worker initialized');
}

// Start if run directly
if (require.main === module) {
  run().catch(console.error);
}

export { calculateDailyMetrics, runDriftDetection };
