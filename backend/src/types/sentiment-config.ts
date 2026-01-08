/**
 * Advanced Sentiment Configuration Types
 * Supports multiple ML providers, custom models, and auto-retraining
 */

export type SentimentProvider = 'openai' | 'huggingface' | 'aws' | 'gcp' | 'custom' | 'keyword';

export type SentimentScope = 'global' | 'workspace' | 'company' | 'campaign' | 'user';

export type SentimentMode = 'keyword' | 'ml';

export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'mixed';

export type DerivedMetric = 'urgency' | 'tone' | 'subjectivity' | 'intent' | 'emotion';

export interface ModelConfig {
  provider: SentimentProvider;
  modelId: string;
  endpoint?: string; // For custom models
  apiKey?: string; // Encrypted in storage
  region?: string; // For AWS/GCP
  params?: Record<string, any>;
  timeout?: number;
  maxRetries?: number;
}

export interface ThresholdConfig {
  negative: number; // 0-1
  neutral: number;
  positive: number;
  minConfidence?: number; // Minimum confidence to accept prediction
}

export interface LabelMapping {
  [modelLabel: string]: string; // Maps provider labels to product labels
}

export interface DerivedMetricRule {
  metric: DerivedMetric;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface SamplingConfig {
  sampleRate: number; // 0-1, percentage of predictions to store
  sampleStrategy?: 'random' | 'confidence-based' | 'all';
  storeLowConfidence?: boolean;
}

export interface FeedbackConfig {
  enabled: boolean;
  webhookUrl?: string;
  autoRetrain?: boolean; // Only for ML mode
  retrainThreshold?: number; // Min samples before retrain
  humanReview?: boolean; // Require human approval
}

export interface DriftDetectionConfig {
  enabled: boolean;
  threshold: number; // KL divergence or similar
  rollbackOnDrift?: boolean;
  alertWebhook?: string;
}

export interface SentimentConfig {
  id: string;
  name: string;
  description?: string;
  scope: SentimentScope;
  scopeId?: string; // workspace_id, company_id, campaign_id, or user_id
  mode: SentimentMode;
  version: number;
  enabled: boolean;
  
  // Model configuration
  model: ModelConfig;
  
  // Thresholds and mappings
  thresholds: ThresholdConfig;
  labelMapping?: LabelMapping;
  
  // Derived metrics
  derivedMetrics?: DerivedMetricRule[];
  
  // Sampling and feedback
  sampling?: SamplingConfig;
  feedback?: FeedbackConfig;
  
  // Monitoring
  driftDetection?: DriftDetectionConfig;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  // Parent config (for inheritance)
  parentConfigId?: string;
}

export interface SentimentPrediction {
  id: string;
  configId: string;
  contactId?: string;
  channel: string; // 'sms', 'email', 'call', 'ticket', 'chat'
  text: string;
  
  // Model response
  label: SentimentLabel;
  score: number; // -1 to 1 or 0 to 1 depending on model
  confidence: number; // 0-1
  rawResponse?: Record<string, any>;
  
  // Derived metrics
  derivedMetrics?: Record<DerivedMetric, any>;
  
  // Metadata
  modelProvider: SentimentProvider;
  modelVersion?: string;
  processingTimeMs?: number;
  createdAt: Date;
}

export interface SentimentFeedback {
  id: string;
  predictionId: string;
  configId: string;
  
  // User correction
  userLabel: SentimentLabel;
  userConfidence?: number;
  userId: string;
  
  // Review status
  reviewStatus: 'pending' | 'accepted' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  
  // Training inclusion
  includedInTraining?: boolean;
  trainingBatchId?: string;
  
  createdAt: Date;
}

export interface SentimentConfigAudit {
  id: string;
  configId: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'enable' | 'disable' | 'rollback';
  previousVersion?: number;
  newVersion?: number;
  diff?: Record<string, any>;
  reason?: string;
  createdAt: Date;
}

export interface SentimentMetric {
  id: string;
  configId: string;
  date: Date;
  metricName: string;
  metricValue: number;
  metadata?: Record<string, any>;
}

// API Request/Response types
export interface CreateSentimentConfigRequest {
  name: string;
  description?: string;
  scope: SentimentScope;
  scopeId?: string;
  mode: SentimentMode;
  model: ModelConfig;
  thresholds: ThresholdConfig;
  labelMapping?: LabelMapping;
  derivedMetrics?: DerivedMetricRule[];
  sampling?: SamplingConfig;
  feedback?: FeedbackConfig;
  driftDetection?: DriftDetectionConfig;
}

export interface UpdateSentimentConfigRequest extends Partial<CreateSentimentConfigRequest> {
  reason?: string;
}

export interface PreviewSentimentRequest {
  configId: string;
  texts: string[];
}

export interface PreviewSentimentResponse {
  predictions: Array<{
    text: string;
    label: SentimentLabel;
    score: number;
    confidence: number;
    derivedMetrics?: Record<DerivedMetric, any>;
    processingTimeMs: number;
  }>;
}

export interface BulkPredictRequest {
  configId?: string; // Optional, will use effective config if not provided
  channel: string;
  items: Array<{
    id: string;
    text: string;
    contactId?: string;
    metadata?: Record<string, any>;
  }>;
}

export interface ValidateConfigRequest {
  config: CreateSentimentConfigRequest;
}

export interface ValidateConfigResponse {
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}
