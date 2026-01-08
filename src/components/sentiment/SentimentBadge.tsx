/**
 * Sentiment Badge Component
 * Display sentiment with color coding
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Minus, AlertTriangle } from 'lucide-react';

interface SentimentBadgeProps {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  score?: number;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showScore?: boolean;
}

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  score,
  confidence,
  size = 'md',
  showIcon = true,
  showScore = false,
}) => {
  const getColors = () => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300';
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300';
      case 'mixed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300';
    }
  };

  const getIcon = () => {
    const iconClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className={iconClass} />;
      case 'negative':
        return <ThumbsDown className={iconClass} />;
      case 'mixed':
        return <AlertTriangle className={iconClass} />;
      default:
        return <Minus className={iconClass} />;
    }
  };

  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : size === 'lg' ? 'text-base px-3 py-1' : 'text-sm px-2 py-1';

  return (
    <Badge variant="outline" className={`${getColors()} ${sizeClass} font-medium border inline-flex items-center gap-1.5`}>
      {showIcon && getIcon()}
      <span className="capitalize">{sentiment}</span>
      {showScore && score !== undefined && (
        <span className="font-mono ml-1">
          {score > 0 ? '+' : ''}{score.toFixed(2)}
        </span>
      )}
      {confidence !== undefined && (
        <span className="text-xs opacity-70 ml-1">
          ({(confidence * 100).toFixed(0)}%)
        </span>
      )}
    </Badge>
  );
};

interface SentimentTrendProps {
  history: Array<{
    label: 'positive' | 'neutral' | 'negative' | 'mixed';
    score: number;
    createdAt: string;
  }>;
}

export const SentimentTrend: React.FC<SentimentTrendProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No sentiment history available
      </div>
    );
  }

  const recentSentiments = history.slice(0, 10);
  const averageScore = recentSentiments.reduce((acc, h) => acc + h.score, 0) / recentSentiments.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Recent Trend:</span>
        <SentimentBadge
          sentiment={
            averageScore > 0.3 ? 'positive' :
            averageScore < -0.3 ? 'negative' :
            'neutral'
          }
          score={averageScore}
        />
      </div>
      <div className="flex gap-1">
        {recentSentiments.reverse().map((item, i) => (
          <div
            key={i}
            className={`h-8 w-2 rounded-sm ${
              item.label === 'positive'
                ? 'bg-green-400'
                : item.label === 'negative'
                ? 'bg-red-400'
                : item.label === 'mixed'
                ? 'bg-yellow-400'
                : 'bg-gray-300'
            }`}
            title={`${item.label} (${item.score.toFixed(2)}) - ${new Date(item.createdAt).toLocaleString()}`}
          />
        ))}
      </div>
    </div>
  );
};
