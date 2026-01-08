/**
 * Sentiment Telemetry & Monitoring Service
 * Tracks metrics, detects drift, and triggers alerts
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database';
import { SentimentConfigService } from './ConfigService';

interface MetricRecord {
  configId: string;
  date: Date;
  metricName: string;
  metricValue: number;
  metadata?: Record<string, any>;
}

export class SentimentTelemetryService {
  private configService: SentimentConfigService;

  constructor() {
    this.configService = new SentimentConfigService();
  }

  /**
   * Record a metric
   */
  async recordMetric(metric: MetricRecord): Promise<void> {
    const query = `
      INSERT INTO sentiment_metrics (id, config_id, date, metric_name, metric_value, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE metric_value = VALUES(metric_value), metadata = VALUES(metadata)
    `;

    await db.query(query, [
      uuidv4(),
      metric.configId,
      metric.date,
      metric.metricName,
      metric.metricValue,
      metric.metadata ? JSON.stringify(metric.metadata) : null,
    ]);
  }

  /**
   * Get metrics for a config over a date range
   */
  async getMetrics(
    configId: string,
    metricName?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    let query = `
      SELECT * FROM sentiment_metrics
      WHERE config_id = ?
    `;
    const params: any[] = [configId];

    if (metricName) {
      query += ' AND metric_name = ?';
      params.push(metricName);
    }

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC';

    const results = await db.query(query, params);
    return results.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  /**
   * Calculate daily metrics from predictions
   */
  async calculateDailyMetrics(configId: string, date: Date): Promise<void> {
    // Get all predictions for this config on this date
    const query = `
      SELECT 
        label,
        COUNT(*) as count,
        AVG(score) as avg_score,
        AVG(confidence) as avg_confidence,
        AVG(processing_time_ms) as avg_processing_time
      FROM sentiment_predictions
      WHERE config_id = ? 
        AND DATE(created_at) = DATE(?)
      GROUP BY label
    `;

    const results = await db.query(query, [configId, date]);

    // Calculate distribution
    const totalPredictions = results.reduce((sum: number, r: any) => sum + r.count, 0);
    const distribution: Record<string, number> = {};

    for (const row of results) {
      distribution[row.label] = row.count / totalPredictions;

      // Record label-specific metrics
      await this.recordMetric({
        configId,
        date,
        metricName: `${row.label}_count`,
        metricValue: row.count,
      });

      await this.recordMetric({
        configId,
        date,
        metricName: `${row.label}_avg_score`,
        metricValue: row.avg_score,
      });

      await this.recordMetric({
        configId,
        date,
        metricName: `${row.label}_avg_confidence`,
        metricValue: row.avg_confidence,
      });
    }

    // Record distribution
    await this.recordMetric({
      configId,
      date,
      metricName: 'label_distribution',
      metricValue: 0, // Placeholder
      metadata: distribution,
    });

    // Record aggregate metrics
    const avgProcessingTime = results.reduce((sum: number, r: any) => sum + r.avg_processing_time, 0) / results.length;
    await this.recordMetric({
      configId,
      date,
      metricName: 'avg_processing_time_ms',
      metricValue: avgProcessingTime || 0,
    });

    await this.recordMetric({
      configId,
      date,
      metricName: 'total_predictions',
      metricValue: totalPredictions,
    });
  }

  /**
   * Detect drift by comparing recent distribution to baseline
   */
  async detectDrift(configId: string): Promise<{
    hasDrift: boolean;
    driftScore: number;
    details: any;
  }> {
    const config = await this.configService.getConfigById(configId);
    if (!config || !config.driftDetection?.enabled) {
      return { hasDrift: false, driftScore: 0, details: {} };
    }

    const threshold = config.driftDetection.threshold || 0.1;

    // Get baseline distribution (first 30 days)
    const baselineMetrics = await this.getMetrics(
      configId,
      'label_distribution',
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)  // 60 days ago
    );

    // Get recent distribution (last 7 days)
    const recentMetrics = await this.getMetrics(
      configId,
      'label_distribution',
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      new Date()
    );

    if (baselineMetrics.length === 0 || recentMetrics.length === 0) {
      return { hasDrift: false, driftScore: 0, details: { reason: 'Insufficient data' } };
    }

    // Calculate average distributions
    const baselineDistribution = this.averageDistribution(
      baselineMetrics.map(m => m.metadata)
    );
    const recentDistribution = this.averageDistribution(
      recentMetrics.map(m => m.metadata)
    );

    // Calculate KL divergence
    const driftScore = this.calculateKLDivergence(baselineDistribution, recentDistribution);

    const hasDrift = driftScore > threshold;

    if (hasDrift) {
      // Log drift event
      console.warn(`Drift detected for config ${configId}: score ${driftScore.toFixed(4)}, threshold ${threshold}`);

      // Optionally trigger rollback
      if (config.driftDetection.rollbackOnDrift) {
        await this.triggerRollback(configId);
      }

      // Send alert webhook
      if (config.driftDetection.alertWebhook) {
        await this.sendDriftAlert(config.driftDetection.alertWebhook, {
          configId,
          driftScore,
          threshold,
          baselineDistribution,
          recentDistribution,
        });
      }
    }

    return {
      hasDrift,
      driftScore,
      details: {
        baselineDistribution,
        recentDistribution,
        threshold,
      },
    };
  }

  /**
   * Helper: Average distributions
   */
  private averageDistribution(distributions: any[]): Record<string, number> {
    const avg: Record<string, number> = {};
    const labels = new Set<string>();

    // Collect all labels
    distributions.forEach(dist => {
      Object.keys(dist).forEach(label => labels.add(label));
    });

    // Calculate averages
    labels.forEach(label => {
      const values = distributions.map(dist => dist[label] || 0);
      avg[label] = values.reduce((sum, v) => sum + v, 0) / values.length;
    });

    return avg;
  }

  /**
   * Helper: Calculate KL Divergence
   */
  private calculateKLDivergence(p: Record<string, number>, q: Record<string, number>): number {
    let divergence = 0;

    Object.keys(p).forEach(label => {
      const pVal = p[label] || 0.0001; // Avoid log(0)
      const qVal = q[label] || 0.0001;

      divergence += pVal * Math.log(pVal / qVal);
    });

    return Math.abs(divergence);
  }

  /**
   * Trigger automatic rollback to previous version
   */
  private async triggerRollback(configId: string): Promise<void> {
    try {
      const config = await this.configService.getConfigById(configId);
      if (!config || config.version <= 1) return;

      console.log(`Rolling back config ${configId} from version ${config.version} to ${config.version - 1}`);

      // Rollback is handled by ConfigService
      await this.configService.rollbackConfig(configId, config.version - 1, 'system');
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  }

  /**
   * Send drift alert to webhook
   */
  private async sendDriftAlert(webhookUrl: string, data: any): Promise<void> {
    try {
      const axios = require('axios');
      await axios.post(webhookUrl, {
        event: 'sentiment_drift_detected',
        timestamp: new Date().toISOString(),
        data,
      });
    } catch (error) {
      console.error('Failed to send drift alert:', error);
    }
  }

  /**
   * Get dashboard metrics for a config
   */
  async getDashboardMetrics(configId: string, days: number = 30): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await this.getMetrics(configId, undefined, startDate);

    // Group by metric name
    const grouped: Record<string, any[]> = {};
    metrics.forEach(m => {
      if (!grouped[m.metric_name]) grouped[m.metric_name] = [];
      grouped[m.metric_name].push(m);
    });

    return grouped;
  }
}
