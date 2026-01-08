/**
 * Universal Model Adapter for Sentiment Analysis
 * Supports: OpenAI, Hugging Face, AWS Comprehend, Google Cloud NLP, Custom endpoints
 */

import { ModelConfig, SentimentLabel, SentimentPrediction } from '../../types/sentiment-config';
import axios, { AxiosInstance } from 'axios';

export interface ModelResponse {
  label: SentimentLabel;
  score: number; // Normalized -1 to 1 or 0 to 1
  confidence: number; // 0 to 1
  rawResponse: any;
  processingTimeMs: number;
}

export abstract class BaseSentimentModel {
  protected config: ModelConfig;
  protected httpClient: AxiosInstance;

  constructor(config: ModelConfig) {
    this.config = config;
    this.httpClient = axios.create({
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  abstract predict(text: string): Promise<ModelResponse>;

  protected normalizeScore(score: number, min: number, max: number): number {
    return (score - min) / (max - min);
  }

  protected mapToStandardLabel(providerLabel: string): SentimentLabel {
    const label = providerLabel.toLowerCase();
    if (label.includes('pos')) return 'positive';
    if (label.includes('neg')) return 'negative';
    if (label.includes('neut')) return 'neutral';
    if (label.includes('mix')) return 'mixed';
    return 'neutral';
  }

  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    throw lastError;
  }
}

/**
 * OpenAI Sentiment Model
 * Uses GPT models for zero-shot sentiment classification
 */
export class OpenAISentimentModel extends BaseSentimentModel {
  async predict(text: string): Promise<ModelResponse> {
    const startTime = Date.now();

    const response = await this.retryWithBackoff(async () => {
      return await this.httpClient.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.config.modelId || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with a JSON object containing: sentiment (positive/negative/neutral/mixed), score (-1 to 1), and confidence (0 to 1).',
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.3,
          max_tokens: 100,
          response_format: { type: 'json_object' },
          ...this.config.params,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        }
      );
    });

    const result = JSON.parse(response.data.choices[0].message.content);

    return {
      label: this.mapToStandardLabel(result.sentiment),
      score: result.score || 0,
      confidence: result.confidence || 0.8,
      rawResponse: response.data,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Hugging Face Sentiment Model
 * Uses Hugging Face Inference API
 */
export class HuggingFaceSentimentModel extends BaseSentimentModel {
  async predict(text: string): Promise<ModelResponse> {
    const startTime = Date.now();

    const modelId = this.config.modelId || 'distilbert-base-uncased-finetuned-sst-2-english';

    const response = await this.retryWithBackoff(async () => {
      return await this.httpClient.post(
        `https://api-inference.huggingface.co/models/${modelId}`,
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        }
      );
    });

    const results = response.data[0];
    // HF returns array of [{label, score}]
    const topResult = results.reduce((max: any, curr: any) =>
      curr.score > max.score ? curr : max
    );

    // Convert score to -1 to 1 scale
    let normalizedScore = 0;
    const label = this.mapToStandardLabel(topResult.label);
    if (label === 'positive') normalizedScore = topResult.score;
    else if (label === 'negative') normalizedScore = -topResult.score;

    return {
      label,
      score: normalizedScore,
      confidence: topResult.score,
      rawResponse: response.data,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * AWS Comprehend Sentiment Model
 */
export class AWSComprehendSentimentModel extends BaseSentimentModel {
  async predict(text: string): Promise<ModelResponse> {
    const startTime = Date.now();

    // AWS SDK would be imported here
    const AWS = require('aws-sdk');
    const comprehend = new AWS.Comprehend({
      region: this.config.region || 'us-east-1',
      accessKeyId: this.config.apiKey,
      secretAccessKey: this.config.params?.secretKey,
    });

    const response = await this.retryWithBackoff(async () => {
      return await comprehend
        .detectSentiment({
          Text: text,
          LanguageCode: this.config.params?.languageCode || 'en',
        })
        .promise();
    });

    const sentiment = response.Sentiment.toLowerCase();
    const scores = response.SentimentScore;

    let normalizedScore = 0;
    if (sentiment === 'positive') normalizedScore = scores.Positive;
    else if (sentiment === 'negative') normalizedScore = -scores.Negative;
    else if (sentiment === 'mixed') normalizedScore = scores.Positive - scores.Negative;

    return {
      label: this.mapToStandardLabel(sentiment),
      score: normalizedScore,
      confidence: Math.max(scores.Positive, scores.Negative, scores.Neutral, scores.Mixed),
      rawResponse: response,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Google Cloud Natural Language Sentiment Model
 */
export class GCPNaturalLanguageSentimentModel extends BaseSentimentModel {
  async predict(text: string): Promise<ModelResponse> {
    const startTime = Date.now();

    const response = await this.retryWithBackoff(async () => {
      return await this.httpClient.post(
        `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${this.config.apiKey}`,
        {
          document: {
            type: 'PLAIN_TEXT',
            content: text,
          },
          encodingType: 'UTF8',
        }
      );
    });

    const sentiment = response.data.documentSentiment;
    // GCP score is -1 to 1, magnitude is 0+
    const score = sentiment.score;
    const magnitude = sentiment.magnitude;

    // Map score to label
    let label: SentimentLabel = 'neutral';
    if (score > 0.25) label = 'positive';
    else if (score < -0.25) label = 'negative';
    else if (magnitude > 3) label = 'mixed';

    return {
      label,
      score,
      confidence: Math.min(magnitude / 10, 1), // Normalize magnitude to confidence
      rawResponse: response.data,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Custom Model Adapter
 * For user-hosted or third-party endpoints
 */
export class CustomSentimentModel extends BaseSentimentModel {
  async predict(text: string): Promise<ModelResponse> {
    const startTime = Date.now();

    if (!this.config.endpoint) {
      throw new Error('Custom model requires endpoint URL');
    }

    const response = await this.retryWithBackoff(async () => {
      return await this.httpClient.post(
        this.config.endpoint!,
        {
          text,
          ...this.config.params,
        },
        {
          headers: {
            ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
          },
        }
      );
    });

    // Expect response format: { label, score, confidence }
    const { label, score, confidence } = response.data;

    return {
      label: this.mapToStandardLabel(label),
      score: score || 0,
      confidence: confidence || 0.5,
      rawResponse: response.data,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Keyword-based Sentiment Model (Legacy)
 * Uses predefined positive/negative keyword lists
 */
export class KeywordSentimentModel extends BaseSentimentModel {
  private positiveKeywords: Set<string>;
  private negativeKeywords: Set<string>;

  constructor(config: ModelConfig) {
    super(config);
    this.positiveKeywords = new Set(config.params?.positiveKeywords || []);
    this.negativeKeywords = new Set(config.params?.negativeKeywords || []);
  }

  async predict(text: string): Promise<ModelResponse> {
    const startTime = Date.now();

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
      if (this.positiveKeywords.has(word)) positiveCount++;
      if (this.negativeKeywords.has(word)) negativeCount++;
    }

    const totalMatches = positiveCount + negativeCount;
    let label: SentimentLabel = 'neutral';
    let score = 0;
    let confidence = 0.5;

    if (totalMatches > 0) {
      const positiveRatio = positiveCount / totalMatches;
      const negativeRatio = negativeCount / totalMatches;

      if (positiveRatio > 0.6) {
        label = 'positive';
        score = positiveRatio;
        confidence = 0.7 + positiveRatio * 0.3;
      } else if (negativeRatio > 0.6) {
        label = 'negative';
        score = -negativeRatio;
        confidence = 0.7 + negativeRatio * 0.3;
      } else if (positiveCount > 0 && negativeCount > 0) {
        label = 'mixed';
        score = positiveRatio - negativeRatio;
        confidence = 0.6;
      }
    }

    return {
      label,
      score,
      confidence,
      rawResponse: { positiveCount, negativeCount, totalMatches },
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Model Factory
 */
export class ModelAdapterFactory {
  static create(config: ModelConfig): BaseSentimentModel {
    switch (config.provider) {
      case 'openai':
        return new OpenAISentimentModel(config);
      case 'huggingface':
        return new HuggingFaceSentimentModel(config);
      case 'aws':
        return new AWSComprehendSentimentModel(config);
      case 'gcp':
        return new GCPNaturalLanguageSentimentModel(config);
      case 'custom':
        return new CustomSentimentModel(config);
      case 'keyword':
        return new KeywordSentimentModel(config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }
}
