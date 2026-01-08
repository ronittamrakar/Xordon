/**
 * Sentiment Prediction Service
 * Handles prediction, storage, and retrieval
 */

import { v4 as uuidv4 } from 'uuid';
import {
  SentimentConfig,
  SentimentPrediction,
  BulkPredictRequest,
  PreviewSentimentRequest,
  PreviewSentimentResponse,
} from '../../types/sentiment-config';
import { ModelAdapterFactory } from './ModelAdapter';
import { SentimentConfigService } from './ConfigService';
import { db } from '../../database';

export class SentimentPredictionService {
  private configService: SentimentConfigService;

  constructor() {
    this.configService = new SentimentConfigService();
  }

  /**
   * Predict sentiment for a single text
   */
  async predict(
    text: string,
    channel: string,
    contactId?: string,
    configId?: string
  ): Promise<SentimentPrediction> {
    // Get effective config
    const config = configId
      ? await this.configService.getConfigById(configId)
      : await this.configService.getEffectiveConfig('global');

    if (!config) {
      throw new Error('No sentiment configuration found');
    }

    // Create model adapter
    const model = ModelAdapterFactory.create(config.model);

    // Get prediction
    const result = await model.predict(text);

    // Apply thresholds
    const finalLabel = this.applyThresholds(result.label, result.score, config.thresholds);

    // Check if we should store (based on sampling config)
    const shouldStore = this.shouldStorePrediction(config, result.confidence);

    const prediction: SentimentPrediction = {
      id: uuidv4(),
      configId: config.id,
      contactId,
      channel,
      text,
      label: finalLabel,
      score: result.score,
      confidence: result.confidence,
      rawResponse: result.rawResponse,
      modelProvider: config.model.provider,
      modelVersion: config.model.modelId,
      processingTimeMs: result.processingTimeMs,
      createdAt: new Date(),
    };

    if (shouldStore) {
      await this.storePrediction(prediction);
    }

    return prediction;
  }

  /**
   * Bulk predict
   */
  async bulkPredict(request: BulkPredictRequest): Promise<SentimentPrediction[]> {
    const predictions: SentimentPrediction[] = [];

    for (const item of request.items) {
      try {
        const prediction = await this.predict(
          item.text,
          request.channel,
          item.contactId,
          request.configId
        );
        predictions.push(prediction);
      } catch (error) {
        console.error(`Failed to predict sentiment for item ${item.id}:`, error);
        // Continue with other items
      }
    }

    return predictions;
  }

  /**
   * Preview sentiment (for testing, doesn't store)
   */
  async preview(request: PreviewSentimentRequest): Promise<PreviewSentimentResponse> {
    const config = await this.configService.getConfigById(request.configId);
    if (!config) {
      throw new Error('Configuration not found');
    }

    const model = ModelAdapterFactory.create(config.model);
    const predictions = [];

    for (const text of request.texts) {
      const result = await model.predict(text);
      const finalLabel = this.applyThresholds(result.label, result.score, config.thresholds);

      predictions.push({
        text,
        label: finalLabel,
        score: result.score,
        confidence: result.confidence,
        derivedMetrics: {}, // TODO: Implement derived metrics
        processingTimeMs: result.processingTimeMs,
      });
    }

    return { predictions };
  }

  /**
   * Get prediction history for a contact
   */
  async getContactHistory(
    contactId: string,
    channel?: string,
    limit: number = 50
  ): Promise<SentimentPrediction[]> {
    let query = `
      SELECT * FROM sentiment_predictions
      WHERE contact_id = ?
    `;
    const params: any[] = [contactId];

    if (channel) {
      query += ' AND channel = ?';
      params.push(channel);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const results = await db.query(query, params);
    return results.map(row => this.deserializePrediction(row));
  }

  /**
   * Get aggregated sentiment metrics
   */
  async getAggregatedMetrics(
    contactId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    let query = `
      SELECT 
        channel,
        label,
        COUNT(*) as count,
        AVG(score) as avg_score,
        AVG(confidence) as avg_confidence
      FROM sentiment_predictions
      WHERE contact_id = ?
    `;
    const params: any[] = [contactId];

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY channel, label';

    const results = await db.query(query, params);
    return results;
  }

  /**
   * Helper: Apply thresholds to determine final label
   */
  private applyThresholds(label: any, score: number, thresholds: any): any {
    const absScore = Math.abs(score);

    if (score >= thresholds.positive) return 'positive';
    if (score <= -thresholds.negative) return 'negative';
    if (absScore <= thresholds.neutral) return 'neutral';

    return label; // Keep original if thresholds don't override
  }

  /**
   * Helper: Determine if prediction should be stored
   */
  private shouldStorePrediction(config: SentimentConfig, confidence: number): boolean {
    if (!config.sampling) return true; // Store all by default

    const { sampleRate, sampleStrategy, storeLowConfidence } = config.sampling;

    if (sampleStrategy === 'all') return true;

    if (sampleStrategy === 'confidence-based') {
      return confidence < 0.7 || (storeLowConfidence && Math.random() < sampleRate);
    }

    // Random sampling
    return Math.random() < sampleRate;
  }

  /**
   * Helper: Store prediction in database
   */
  private async storePrediction(prediction: SentimentPrediction): Promise<void> {
    const query = `
      INSERT INTO sentiment_predictions (
        id, config_id, contact_id, channel, text, label, score, confidence,
        raw_response, model_provider, model_version, processing_time_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      prediction.id,
      prediction.configId,
      prediction.contactId,
      prediction.channel,
      prediction.text,
      prediction.label,
      prediction.score,
      prediction.confidence,
      prediction.rawResponse ? JSON.stringify(prediction.rawResponse) : null,
      prediction.modelProvider,
      prediction.modelVersion,
      prediction.processingTimeMs,
      prediction.createdAt,
    ]);
  }

  /**
   * Helper: Deserialize DB row to prediction object
   */
  private deserializePrediction(row: any): SentimentPrediction {
    return {
      id: row.id,
      configId: row.config_id,
      contactId: row.contact_id,
      channel: row.channel,
      text: row.text,
      label: row.label,
      score: parseFloat(row.score),
      confidence: parseFloat(row.confidence),
      rawResponse: row.raw_response ? JSON.parse(row.raw_response) : undefined,
      derivedMetrics: row.derived_metrics ? JSON.parse(row.derived_metrics) : undefined,
      modelProvider: row.model_provider,
      modelVersion: row.model_version,
      processingTimeMs: row.processing_time_ms,
      createdAt: new Date(row.created_at),
    };
  }
}
