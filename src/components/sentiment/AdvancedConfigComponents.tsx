/**
 * Advanced Sentiment Configuration Components
 * Model selector, label mapper, preview console
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, Cloud, Cpu, Key, Globe, Sparkles, TestTube, 
  TrendingUp, MessageSquare, AlertCircle, RefreshCw,
  CheckCircle, XCircle, ArrowRight
} from 'lucide-react';
import { PreviewResult } from '@/types/sentiment-config';

interface ModelSelectorProps {
  value: any;
  onChange: (value: any) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ value, onChange }) => {
  const providers = [
    { id: 'keyword', name: 'Keyword-Based', icon: MessageSquare, description: 'Simple keyword matching (legacy)' },
    { id: 'openai', name: 'OpenAI', icon: Sparkles, description: 'GPT models for sentiment analysis' },
    { id: 'huggingface', name: 'Hugging Face', icon: Bot, description: 'Open-source transformers' },
    { id: 'aws', name: 'AWS Comprehend', icon: Cloud, description: 'Amazon Web Services NLP' },
    { id: 'gcp', name: 'Google Cloud', icon: Globe, description: 'Google Natural Language API' },
    { id: 'custom', name: 'Custom Model', icon: Cpu, description: 'Your own hosted model' },
  ];

  const getProviderConfig = () => {
    const provider = providers.find(p => p.id === value.provider);
    if (!provider) return null;

    switch (value.provider) {
      case 'openai':
        return (
          <div className="space-y-4 mt-4">
            <div>
              <Label>Model ID</Label>
              <Select 
                value={value.modelId} 
                onValueChange={(v) => onChange({ ...value, modelId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-effective)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o (Most Accurate)</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>API Key</Label>
              <Input 
                type="password"
                value={value.apiKey || ''} 
                onChange={(e) => onChange({ ...value, apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </div>
          </div>
        );
      
      case 'huggingface':
        return (
          <div className="space-y-4 mt-4">
            <div>
              <Label>Model ID</Label>
              <Input 
                value={value.modelId || 'distilbert-base-uncased-finetuned-sst-2-english'} 
                onChange={(e) => onChange({ ...value, modelId: e.target.value })}
                placeholder="Model name or HF model ID"
              />
            </div>
            <div>
              <Label>API Token</Label>
              <Input 
                type="password"
                value={value.apiKey || ''} 
                onChange={(e) => onChange({ ...value, apiKey: e.target.value })}
                placeholder="hf_..."
              />
            </div>
          </div>
        );
      
      case 'aws':
        return (
          <div className="space-y-4 mt-4">
            <div>
              <Label>AWS Region</Label>
              <Select 
                value={value.region || 'us-east-1'} 
                onValueChange={(v) => onChange({ ...value, region: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                  <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                  <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Access Key ID</Label>
              <Input 
                value={value.apiKey || ''} 
                onChange={(e) => onChange({ ...value, apiKey: e.target.value })}
              />
            </div>
            <div>
              <Label>Secret Access Key</Label>
              <Input 
                type="password"
                value={value.params?.secretKey || ''} 
                onChange={(e) => onChange({ ...value, params: { ...value.params, secretKey: e.target.value } })}
              />
            </div>
          </div>
        );
      
      case 'gcp':
        return (
          <div className="space-y-4 mt-4">
            <div>
              <Label>API Key</Label>
              <Input 
                type="password"
                value={value.apiKey || ''} 
                onChange={(e) => onChange({ ...value, apiKey: e.target.value })}
                placeholder="Google Cloud API key"
              />
            </div>
          </div>
        );
      
      case 'custom':
        return (
          <div className="space-y-4 mt-4">
            <div>
              <Label>Endpoint URL</Label>
              <Input 
                value={value.endpoint || ''} 
                onChange={(e) => onChange({ ...value, endpoint: e.target.value })}
                placeholder="https://your-model.example.com/predict"
              />
            </div>
            <div>
              <Label>Authorization (Optional)</Label>
              <Input 
                type="password"
                value={value.apiKey || ''} 
                onChange={(e) => onChange({ ...value, apiKey: e.target.value })}
                placeholder="Bearer token or API key"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Provider</CardTitle>
        <CardDescription>Select the AI model for sentiment analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {providers.map((provider) => {
            const Icon = provider.icon;
            const isSelected = value.provider === provider.id;
            
            return (
              <button
                key={provider.id}
                onClick={() => onChange({ ...value, provider: provider.id, modelId: '' })}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="font-medium text-sm">{provider.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{provider.description}</p>
              </button>
            );
          })}
        </div>
        
        {getProviderConfig()}
      </CardContent>
    </Card>
  );
};

interface ThresholdConfigProps {
  value: any;
  onChange: (value: any) => void;
}

export const ThresholdConfig: React.FC<ThresholdConfigProps> = ({ value, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Thresholds</CardTitle>
        <CardDescription>Configure score ranges for each sentiment category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Negative Threshold</Label>
            <span className="font-mono text-sm">{value.negative?.toFixed(2) || '0.35'}</span>
          </div>
          <Slider
            value={[value.negative || 0.35]}
            onValueChange={([v]) => onChange({ ...value, negative: v })}
            min={0}
            max={1}
            step={0.05}
          />
          <p className="text-xs text-muted-foreground">Scores below -{value.negative?.toFixed(2)} are negative</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Neutral Range</Label>
            <span className="font-mono text-sm">±{value.neutral?.toFixed(2) || '0.50'}</span>
          </div>
          <Slider
            value={[value.neutral || 0.50]}
            onValueChange={([v]) => onChange({ ...value, neutral: v })}
            min={0}
            max={1}
            step={0.05}
          />
          <p className="text-xs text-muted-foreground">Scores between -{value.neutral?.toFixed(2)} and +{value.neutral?.toFixed(2)} are neutral</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Positive Threshold</Label>
            <span className="font-mono text-sm">{value.positive?.toFixed(2) || '0.65'}</span>
          </div>
          <Slider
            value={[value.positive || 0.65]}
            onValueChange={([v]) => onChange({ ...value, positive: v })}
            min={0}
            max={1}
            step={0.05}
          />
          <p className="text-xs text-muted-foreground">Scores above +{value.positive?.toFixed(2)} are positive</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Minimum Confidence</Label>
            <span className="font-mono text-sm">{((value.minConfidence || 0.7) * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[(value.minConfidence || 0.7) * 100]}
            onValueChange={([v]) => onChange({ ...value, minConfidence: v / 100 })}
            min={0}
            max={100}
            step={5}
          />
          <p className="text-xs text-muted-foreground">Predictions with lower confidence will be ignored</p>
        </div>
      </CardContent>
    </Card>
  );
};

interface PreviewConsoleProps {
  configId?: string;
  onPreview: (texts: string[]) => Promise<PreviewResult[]>;
}

export const PreviewConsole: React.FC<PreviewConsoleProps> = ({ configId, onPreview }) => {
  const [testTexts, setTestTexts] = useState('');
  const [results, setResults] = useState<PreviewResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runPreview = async () => {
    const texts = testTexts.split('\n').filter(t => t.trim());
    if (texts.length === 0) return;

    setLoading(true);
    try {
      const predictions = await onPreview(texts);
      setResults(predictions);
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900';
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900';
      case 'mixed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Live Preview Console
        </CardTitle>
        <CardDescription>Test your configuration with sample texts (one per line)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={testTexts}
          onChange={(e) => setTestTexts(e.target.value)}
          placeholder="Enter test texts, one per line...&#10;Example:&#10;I love this product!&#10;This is terrible service.&#10;It's okay, nothing special."
          className="min-h-[120px] font-mono text-sm"
        />
        
        <Button onClick={runPreview} disabled={loading || !testTexts.trim()}>
          {loading ? (
            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Run Analysis</>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3 mt-4">
            {results.map((result, i) => (
              <div key={i} className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm mb-3 font-medium">{result.text}</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge className={getSentimentColor(result.label)}>
                    {result.label}
                  </Badge>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Score:</span> {result.score.toFixed(3)}
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Confidence:</span> {(result.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.processingTimeMs}ms
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface FeedbackConfigProps {
  value: any;
  onChange: (value: any) => void;
  mode: 'keyword' | 'ml';
}

export const FeedbackConfig: React.FC<FeedbackConfigProps> = ({ value, onChange, mode }) => {
  const isMLMode = mode === 'ml';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback & Auto-Retrain</CardTitle>
        <CardDescription>
          Configure human-in-the-loop feedback and automatic model retraining
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Feedback Collection</Label>
            <p className="text-xs text-muted-foreground">Allow users to correct predictions</p>
          </div>
          <Switch
            checked={value?.enabled || false}
            onCheckedChange={(checked) => onChange({ ...value, enabled: checked })}
          />
        </div>

        {value?.enabled && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <Label>Human Review Required</Label>
                <p className="text-xs text-muted-foreground">Admin must approve corrections</p>
              </div>
              <Switch
                checked={value?.humanReview || false}
                onCheckedChange={(checked) => onChange({ ...value, humanReview: checked })}
              />
            </div>

            {isMLMode && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Retrain {!isMLMode && <Badge variant="outline" className="ml-2">ML Mode Only</Badge>}</Label>
                    <p className="text-xs text-muted-foreground">Automatically retrain model with feedback</p>
                  </div>
                  <Switch
                    checked={value?.autoRetrain || false}
                    onCheckedChange={(checked) => onChange({ ...value, autoRetrain: checked })}
                    disabled={!isMLMode}
                  />
                </div>

                {value?.autoRetrain && (
                  <div>
                    <Label>Retrain Threshold (samples)</Label>
                    <Input
                      type="number"
                      value={value?.retrainThreshold || 100}
                      onChange={(e) => onChange({ ...value, retrainThreshold: parseInt(e.target.value) })}
                      min={10}
                      step={10}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Trigger retraining after this many accepted corrections
                    </p>
                  </div>
                )}
              </>
            )}

            <div>
              <Label>Webhook URL (Optional)</Label>
              <Input
                value={value?.webhookUrl || ''}
                onChange={(e) => onChange({ ...value, webhookUrl: e.target.value })}
                placeholder="https://your-webhook.com/feedback"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Receive notifications when feedback is submitted
              </p>
            </div>
          </>
        )}

        {!isMLMode && value?.enabled && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Auto-retraining is only available in ML mode. Switch to an ML provider to enable this feature.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
