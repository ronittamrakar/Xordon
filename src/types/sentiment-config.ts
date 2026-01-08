/**
 * Advanced Sentiment Config Component Types
 */

export interface SentimentConfigExtended {
  id: string;
  name: string;
  description?: string;
  scope: 'global' | 'workspace' | 'company' | 'campaign' | 'user';
  scopeId?: string;
  mode: 'keyword' | 'ml';
  version: number;
  enabled: boolean;
  
  model: {
    provider: 'openai' | 'huggingface' | 'aws' | 'gcp' | 'custom' | 'keyword';
    modelId: string;
    endpoint?: string;
    apiKey?: string;
    region?: string;
    params?: Record<string, any>;
    timeout?: number;
    maxRetries?: number;
  };
  
  thresholds: {
    negative: number;
    neutral: number;
    positive: number;
    minConfidence?: number;
  };
  
  labelMapping?: Record<string, string>;
  derivedMetrics?: Array<{
    metric: 'urgency' | 'tone' | 'subjectivity' | 'intent' | 'emotion';
    enabled: boolean;
    config?: Record<string, any>;
  }>;
  
  sampling?: {
    sampleRate: number;
    sampleStrategy?: 'random' | 'confidence-based' | 'all';
    storeLowConfidence?: boolean;
  };
  
  feedback?: {
    enabled: boolean;
    webhookUrl?: string;
    autoRetrain?: boolean;
    retrainThreshold?: number;
    humanReview?: boolean;
  };
  
  driftDetection?: {
    enabled: boolean;
    threshold: number;
    rollbackOnDrift?: boolean;
    alertWebhook?: string;
  };
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreviewResult {
  text: string;
  label: 'positive' | 'neutral' | 'negative' | 'mixed';
  score: number;
  confidence: number;
  derivedMetrics?: Record<string, any>;
  processingTimeMs: number;
}
