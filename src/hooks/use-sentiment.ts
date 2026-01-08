/**
 * Sentiment Analysis Integration Hooks
 * For SMS, Email, and other channels
 */

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface SentimentResult {
  label: 'positive' | 'neutral' | 'negative' | 'mixed';
  score: number;
  confidence: number;
  shouldTriggerAutomations: boolean;
}

export const useSentimentAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeSentiment = async (
    text: string,
    channel: string,
    contactId?: string
  ): Promise<SentimentResult | null> => {
    if (!text.trim()) return null;

    setAnalyzing(true);
    try {
      const response = await api.post('/sentiment/predict', {
        text,
        channel,
        contactId,
      });

      if (response.prediction) {
        const prediction = response.prediction;
        return {
          label: prediction.label,
          score: prediction.score,
          confidence: prediction.confidence,
          shouldTriggerAutomations: prediction.confidence >= 0.7, // TODO: Use config threshold
        };
      }
      return null;
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeBulk = async (
    items: Array<{ id: string; text: string; contactId?: string }>,
    channel: string
  ): Promise<Map<string, SentimentResult>> => {
    const results = new Map<string, SentimentResult>();

    try {
      const response = await api.post('/sentiment/predict/bulk', {
        channel,
        items,
      });

      if (response.predictions) {
        response.predictions.forEach((pred: any, index: number) => {
          results.set(items[index].id, {
            label: pred.label,
            score: pred.score,
            confidence: pred.confidence,
            shouldTriggerAutomations: pred.confidence >= 0.7,
          });
        });
      }
    } catch (error) {
      console.error('Bulk sentiment analysis error:', error);
    }

    return results;
  };

  return {
    analyzeSentiment,
    analyzeBulk,
    analyzing,
  };
};

export const useSentimentHistory = (contactId: string, channel?: string) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contactId) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/sentiment/history/${contactId}`, {
          params: { channel, limit: 50 },
        });

        if (response.history) {
          setHistory(response.history);
        }
      } catch (error) {
        console.error('Error loading sentiment history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [contactId, channel]);

  return { history, loading };
};

export const useSentimentMetrics = (
  contactId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contactId) return;

    const loadMetrics = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/sentiment/metrics/${contactId}`, {
          params: {
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
          },
        });

        if (response.metrics) {
          setMetrics(response.metrics);
        }
      } catch (error) {
        console.error('Error loading sentiment metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [contactId, startDate, endDate]);

  return { metrics, loading };
};
