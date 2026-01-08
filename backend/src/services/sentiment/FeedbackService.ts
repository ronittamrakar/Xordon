/**
 * Feedback Service
 * Manages human-in-the-loop feedback and retraining workflows
 */

import { v4 as uuidv4 } from 'uuid';
import { SentimentFeedback } from '../../types/sentiment-config';
import { db } from '../../database';

export class FeedbackService {
  /**
   * Submit feedback/correction for a prediction
   */
  async submitFeedback(
    predictionId: string,
    userLabel: string,
    userId: string,
    userConfidence?: number
  ): Promise<SentimentFeedback> {
    // Get the prediction to find the config
    const predQuery = 'SELECT config_id FROM sentiment_predictions WHERE id = ?';
    const predResults = await db.query(predQuery, [predictionId]);

    if (predResults.length === 0) {
      throw new Error('Prediction not found');
    }

    const configId = predResults[0].config_id;

    const feedback: SentimentFeedback = {
      id: uuidv4(),
      predictionId,
      configId,
      userLabel: userLabel as any,
      userConfidence,
      userId,
      reviewStatus: 'pending',
      createdAt: new Date(),
    };

    await this.storeFeedback(feedback);

    return feedback;
  }

  /**
   * Get pending feedback for review
   */
  async getPendingFeedback(configId?: string, limit: number = 50): Promise<SentimentFeedback[]> {
    let query = `
      SELECT * FROM sentiment_feedback
      WHERE review_status = 'pending'
    `;
    const params: any[] = [];

    if (configId) {
      query += ' AND config_id = ?';
      params.push(configId);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const results = await db.query(query, params);
    return results.map(row => this.deserializeFeedback(row));
  }

  /**
   * Review feedback (accept or reject)
   */
  async reviewFeedback(
    feedbackId: string,
    status: 'accepted' | 'rejected',
    reviewerId: string
  ): Promise<void> {
    const query = `
      UPDATE sentiment_feedback
      SET review_status = ?, reviewed_by = ?, reviewed_at = NOW()
      WHERE id = ?
    `;

    await db.query(query, [status, reviewerId, feedbackId]);

    // If accepted, potentially trigger retraining
    if (status === 'accepted') {
      await this.checkRetrainingThreshold(feedbackId);
    }
  }

  /**
   * Get feedback for training dataset
   */
  async getTrainingDataset(configId: string, minSamples: number = 100): Promise<any[]> {
    const query = `
      SELECT 
        sf.*,
        sp.text,
        sp.label as original_label,
        sp.score as original_score
      FROM sentiment_feedback sf
      JOIN sentiment_predictions sp ON sf.prediction_id = sp.id
      WHERE sf.config_id = ?
        AND sf.review_status = 'accepted'
        AND sf.included_in_training = FALSE
      ORDER BY sf.created_at DESC
      LIMIT ?
    `;

    const results = await db.query(query, [configId, minSamples * 2]); // Get more than needed
    return results;
  }

  /**
   * Mark feedback as included in training batch
   */
  async markAsIncludedInTraining(
    feedbackIds: string[],
    trainingBatchId: string
  ): Promise<void> {
    const placeholders = feedbackIds.map(() => '?').join(',');
    const query = `
      UPDATE sentiment_feedback
      SET included_in_training = TRUE, training_batch_id = ?
      WHERE id IN (${placeholders})
    `;

    await db.query(query, [trainingBatchId, ...feedbackIds]);
  }

  /**
   * Helper: Store feedback in database
   */
  private async storeFeedback(feedback: SentimentFeedback): Promise<void> {
    const query = `
      INSERT INTO sentiment_feedback (
        id, prediction_id, config_id, user_label, user_confidence,
        user_id, review_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      feedback.id,
      feedback.predictionId,
      feedback.configId,
      feedback.userLabel,
      feedback.userConfidence,
      feedback.userId,
      feedback.reviewStatus,
      feedback.createdAt,
    ]);
  }

  /**
   * Helper: Deserialize DB row to feedback object
   */
  private deserializeFeedback(row: any): SentimentFeedback {
    return {
      id: row.id,
      predictionId: row.prediction_id,
      configId: row.config_id,
      userLabel: row.user_label,
      userConfidence: row.user_confidence ? parseFloat(row.user_confidence) : undefined,
      userId: row.user_id,
      reviewStatus: row.review_status,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
      includedInTraining: Boolean(row.included_in_training),
      trainingBatchId: row.training_batch_id,
      createdAt: new Date(row.created_at),
    };
  }

  /**
   * Helper: Check if retraining threshold is met
   */
  private async checkRetrainingThreshold(feedbackId: string): Promise<void> {
    // Get the config for this feedback
    const query = 'SELECT config_id FROM sentiment_feedback WHERE id = ?';
    const results = await db.query(query, [feedbackId]);

    if (results.length === 0) return;

    const configId = results[0].config_id;

    // Get config to check if auto-retrain is enabled
    const configQuery = 'SELECT feedback_config FROM sentiment_configs WHERE id = ?';
    const configResults = await db.query(configQuery, [configId]);

    if (configResults.length === 0) return;

    const feedbackConfig = JSON.parse(configResults[0].feedback_config);

    if (!feedbackConfig?.autoRetrain) return;

    // Count accepted, not-yet-trained feedback
    const countQuery = `
      SELECT COUNT(*) as count
      FROM sentiment_feedback
      WHERE config_id = ?
        AND review_status = 'accepted'
        AND included_in_training = FALSE
    `;

    const countResults = await db.query(countQuery, [configId]);
    const count = countResults[0].count;

    const threshold = feedbackConfig.retrainThreshold || 100;

    if (count >= threshold) {
      // TODO: Trigger retraining job
      console.log(`Retraining threshold met for config ${configId}: ${count} samples`);
      // This would typically enqueue a job to the training service
    }
  }
}
