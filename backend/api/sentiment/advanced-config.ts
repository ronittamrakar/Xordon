/**
 * Sentiment Configuration API Routes
 * Handles all advanced sentiment config endpoints
 */

import express from 'express';
import { SentimentConfigService } from '../../services/sentiment/ConfigService';
import { SentimentPredictionService } from '../../services/sentiment/PredictionService';
import { FeedbackService } from '../../services/sentiment/FeedbackService';
import { auth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import {
  CreateSentimentConfigRequest,
  UpdateSentimentConfigRequest,
  PreviewSentimentRequest,
  BulkPredictRequest,
  ValidateConfigRequest,
} from '../../types/sentiment-config';

const router = express.Router();

const configService = new SentimentConfigService();
const predictionService = new SentimentPredictionService();
const feedbackService = new FeedbackService();

/**
 * GET /api/sentiment-configs
 * List all configurations with optional filtering
 */
router.get('/', auth, async (req, res) => {
  try {
    const { scope, scopeId, enabled } = req.query;

    const configs = await configService.listConfigs({
      scope: scope as any,
      scopeId: scopeId as string,
      enabled: enabled ? enabled === 'true' : undefined,
    });

    res.json({ configs });
  } catch (error: any) {
    console.error('Error listing sentiment configs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sentiment-configs/effective
 * Get effective configuration for current user/context
 */
router.get('/effective', auth, async (req, res) => {
  try {
    const { scope, scopeId } = req.query;

    const config = await configService.getEffectiveConfig(
      (scope as any) || 'global',
      scopeId as string
    );

    if (!config) {
      return res.status(404).json({ error: 'No configuration found' });
    }

    res.json({ config });
  } catch (error: any) {
    console.error('Error getting effective config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sentiment-configs/:id
 * Get specific configuration by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const config = await configService.getConfigById(req.params.id);

    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({ config });
  } catch (error: any) {
    console.error('Error getting sentiment config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sentiment-configs
 * Create new sentiment configuration
 */
router.post('/', auth, validateRequest, async (req, res) => {
  try {
    const request: CreateSentimentConfigRequest = req.body;
    const userId = req.user!.id;

    // TODO: Add RBAC checks here
    // Only admins or scope owners should be able to create configs

    const config = await configService.createConfig(request, userId);

    res.status(201).json({ config });
  } catch (error: any) {
    console.error('Error creating sentiment config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/sentiment-configs/:id
 * Update configuration (creates new version)
 */
router.put('/:id', auth, validateRequest, async (req, res) => {
  try {
    const request: UpdateSentimentConfigRequest = req.body;
    const userId = req.user!.id;

    // TODO: Add RBAC checks

    const config = await configService.updateConfig(req.params.id, request, userId);

    res.json({ config });
  } catch (error: any) {
    console.error('Error updating sentiment config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/sentiment-configs/:id/toggle
 * Enable/disable configuration
 */
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const { enabled } = req.body;
    const userId = req.user!.id;

    await configService.toggleConfig(req.params.id, enabled, userId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error toggling sentiment config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/sentiment-configs/:id
 * Soft delete configuration
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user!.id;

    await configService.deleteConfig(req.params.id, userId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting sentiment config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sentiment-configs/:id/rollback
 * Rollback to a previous version
 */
router.post('/:id/rollback', auth, async (req, res) => {
  try {
    const { toVersion } = req.body;
    const userId = req.user!.id;

    const config = await configService.rollbackConfig(req.params.id, toVersion, userId);

    res.json({ config });
  } catch (error: any) {
    console.error('Error rolling back sentiment config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sentiment-configs/:id/audit
 * Get audit history for configuration
 */
router.get('/:id/audit', auth, async (req, res) => {
  try {
    const history = await configService.getAuditHistory(req.params.id);

    res.json({ history });
  } catch (error: any) {
    console.error('Error getting audit history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sentiment-configs/:id/preview
 * Preview sentiment analysis with sample texts
 */
router.post('/:id/preview', auth, async (req, res) => {
  try {
    const request: PreviewSentimentRequest = {
      configId: req.params.id,
      texts: req.body.texts,
    };

    const result = await predictionService.preview(request);

    res.json(result);
  } catch (error: any) {
    console.error('Error previewing sentiment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sentiment-configs/:id/validate
 * Validate configuration before saving
 */
router.post('/:id/validate', auth, async (req, res) => {
  try {
    const request: ValidateConfigRequest = req.body;

    // TODO: Implement validation logic
    // Check model compatibility, thresholds, API keys, etc.

    res.json({
      valid: true,
      errors: [],
      warnings: [],
    });
  } catch (error: any) {
    console.error('Error validating config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sentiment/predict
 * Single prediction
 */
router.post('/predict', auth, async (req, res) => {
  try {
    const { text, channel, contactId, configId } = req.body;

    const prediction = await predictionService.predict(text, channel, contactId, configId);

    res.json({ prediction });
  } catch (error: any) {
    console.error('Error predicting sentiment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sentiment/predict/bulk
 * Bulk predictions
 */
router.post('/predict/bulk', auth, async (req, res) => {
  try {
    const request: BulkPredictRequest = req.body;

    const predictions = await predictionService.bulkPredict(request);

    res.json({ predictions });
  } catch (error: any) {
    console.error('Error bulk predicting sentiment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sentiment/history/:contactId
 * Get sentiment history for a contact
 */
router.get('/history/:contactId', auth, async (req, res) => {
  try {
    const { channel, limit } = req.query;

    const history = await predictionService.getContactHistory(
      req.params.contactId,
      channel as string,
      limit ? parseInt(limit as string) : 50
    );

    res.json({ history });
  } catch (error: any) {
    console.error('Error getting sentiment history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sentiment/metrics/:contactId
 * Get aggregated sentiment metrics for a contact
 */
router.get('/metrics/:contactId', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const metrics = await predictionService.getAggregatedMetrics(
      req.params.contactId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({ metrics });
  } catch (error: any) {
    console.error('Error getting sentiment metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sentiment/feedback
 * Submit feedback/correction for a prediction
 */
router.post('/feedback', auth, async (req, res) => {
  try {
    const { predictionId, userLabel, userConfidence } = req.body;
    const userId = req.user!.id;

    const feedback = await feedbackService.submitFeedback(
      predictionId,
      userLabel,
      userId,
      userConfidence
    );

    res.status(201).json({ feedback });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sentiment/feedback/pending
 * Get pending feedback for review
 */
router.get('/feedback/pending', auth, async (req, res) => {
  try {
    const { configId, limit } = req.query;

    const feedback = await feedbackService.getPendingFeedback(
      configId as string,
      limit ? parseInt(limit as string) : 50
    );

    res.json({ feedback });
  } catch (error: any) {
    console.error('Error getting pending feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/sentiment/feedback/:id/review
 * Review and accept/reject feedback
 */
router.patch('/feedback/:id/review', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const userId = req.user!.id;

    await feedbackService.reviewFeedback(req.params.id, status, userId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error reviewing feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
