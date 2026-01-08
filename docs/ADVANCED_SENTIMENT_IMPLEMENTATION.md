# Advanced Sentiment Analysis System

## Overview

The Advanced Sentiment Analysis System provides AI-powered sentiment detection across all channels (SMS, Email, Calls, Tickets, Chat) with support for multiple ML providers, automatic retraining, drift detection, and comprehensive monitoring.

## Key Features

### 🤖 Multi-Provider Support
- **OpenAI**: GPT-4o, GPT-4o-mini for high-accuracy sentiment analysis
- **Hugging Face**: Open-source transformer models
- **AWS Comprehend**: Amazon's NLP service
- **Google Cloud NLP**: Google's Natural Language API
- **Custom Models**: Your own hosted sentiment models
- **Keyword Mode**: Legacy keyword-based analysis (backward compatible)

### 🎯 Advanced Configuration
- **Scope-based configs**: Global, Workspace, Company, Campaign, or User-level
- **Version control**: Full versioning with rollback capability
- **Threshold customization**: Fine-tune negative/neutral/positive boundaries
- **Label mapping**: Map provider labels to your business terminology
- **Sampling strategies**: Control which predictions are stored

### 🔄 Human-in-the-Loop
- **Feedback collection**: Users can correct predictions
- **Review workflow**: Admin approval for training data
- **Auto-retraining**: Automatically retrain models (ML mode only)
- **Webhook integration**: Real-time feedback notifications

### 📊 Monitoring & Telemetry
- **Daily metrics**: Automatic calculation of label distributions, confidence, latency
- **Drift detection**: KL-divergence based monitoring with automatic alerts
- **Auto-rollback**: Revert to previous version if performance degrades
- **Dashboard**: Real-time visualization of sentiment trends

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  SentimentConfig.tsx  │  AdvancedConfigComponents.tsx       │
│  SentimentBadge.tsx   │  Hooks: use-sentiment.ts            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Express/PHP)                       │
│  /sentiment-configs/*  │  /sentiment/predict/*              │
│  /sentiment/feedback/* │  /sentiment/metrics/*              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌────────────┐ ┌──────────┐ ┌──────────────┐
│  Config    │ │Prediction│ │  Feedback    │
│  Service   │ │ Service  │ │  Service     │
└────┬───────┘ └────┬─────┘ └──────┬───────┘
     │              │               │
     └──────────────┼───────────────┘
                    │
                    ▼
          ┌─────────────────────┐
          │   Model Adapters    │
          │  (Factory Pattern)  │
          └──────────┬──────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
┌─────────┐    ┌──────────┐    ┌─────────┐
│ OpenAI  │    │Hugging   │    │  AWS    │
│ Adapter │    │Face      │    │Comprehend│
└─────────┘    │Adapter   │    └─────────┘
               └──────────┘
                    ├─ GCP, Custom, Keyword
                    
┌─────────────────────────────────────────────────────────────┐
│                      Database (MySQL)                        │
│  sentiment_configs  │  sentiment_predictions               │
│  sentiment_feedback │  sentiment_metrics                   │
│  sentiment_config_audit │ sentiment_training_batches       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Background Workers                       │
│  sentiment-metrics.ts: Daily metrics + Drift detection       │
│  auto-retrain-job.ts: Model retraining orchestration        │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### sentiment_configs
```sql
- id: Primary key
- scope: global|workspace|company|campaign|user
- scope_id: Foreign key to scope entity
- mode: keyword|ml
- version: Integer version number
- enabled: Boolean
- model_config: JSON (provider, modelId, endpoint, params)
- threshold_config: JSON (negative, neutral, positive, minConfidence)
- label_mapping: JSON
- derived_metrics_config: JSON
- sampling_config: JSON
- feedback_config: JSON (enabled, autoRetrain, webhookUrl)
- drift_detection_config: JSON (enabled, threshold, rollbackOnDrift)
- parent_config_id: For inheritance
- created_by, created_at, updated_at, deleted_at
```

### sentiment_predictions
```sql
- id, config_id, contact_id, channel, text
- label, score, confidence, raw_response
- derived_metrics: JSON
- model_provider, model_version, processing_time_ms
- created_at
```

### sentiment_feedback
```sql
- id, prediction_id, config_id
- user_label, user_confidence, user_id
- review_status: pending|accepted|rejected
- reviewed_by, reviewed_at
- included_in_training, training_batch_id
- created_at
```

### sentiment_metrics
```sql
- id, config_id, date, metric_name, metric_value
- metadata: JSON
- created_at
```

## API Endpoints

### Configuration Management
```
GET    /api/sentiment-configs              List all configs
GET    /api/sentiment-configs/effective    Get effective config for scope
GET    /api/sentiment-configs/:id          Get specific config
POST   /api/sentiment-configs              Create new config
PUT    /api/sentiment-configs/:id          Update config (new version)
DELETE /api/sentiment-configs/:id          Soft delete config
PATCH  /api/sentiment-configs/:id/toggle   Enable/disable
POST   /api/sentiment-configs/:id/rollback Rollback to version
GET    /api/sentiment-configs/:id/audit    Get change history
```

### Prediction
```
POST   /api/sentiment/predict              Single prediction
POST   /api/sentiment/predict/bulk         Bulk predictions
POST   /api/sentiment-configs/:id/preview  Test preview (no storage)
GET    /api/sentiment/history/:contactId   Get contact history
GET    /api/sentiment/metrics/:contactId   Get aggregated metrics
```

### Feedback
```
POST   /api/sentiment/feedback              Submit correction
GET    /api/sentiment/feedback/pending      List pending reviews
PATCH  /api/sentiment/feedback/:id/review   Accept/reject feedback
```

## Usage Examples

### 1. Create OpenAI Configuration

```typescript
const response = await api.post('/sentiment-configs', {
  name: 'Production OpenAI Config',
  scope: 'workspace',
  scopeId: 'workspace-123',
  mode: 'ml',
  model: {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    params: { temperature: 0.3 }
  },
  thresholds: {
    negative: 0.35,
    neutral: 0.50,
    positive: 0.65,
    minConfidence: 0.70
  },
  feedback: {
    enabled: true,
    autoRetrain: true,
    retrainThreshold: 100,
    humanReview: true
  },
  driftDetection: {
    enabled: true,
    threshold: 0.1,
    rollbackOnDrift: true
  }
});
```

### 2. Analyze Text

```typescript
const prediction = await api.post('/sentiment/predict', {
  text: 'I love this product! Best purchase ever.',
  channel: 'email',
  contactId: 'contact-456'
});

console.log(prediction.label);      // 'positive'
console.log(prediction.confidence); // 0.95
```

### 3. Preview Configuration

```typescript
const preview = await api.post('/sentiment-configs/config-123/preview', {
  texts: [
    'Great service!',
    'Terrible experience.',
    'It was okay.'
  ]
});

preview.predictions.forEach(p => {
  console.log(`"${p.text}" → ${p.label} (${p.confidence})`);
});
```

### 4. Submit Feedback

```typescript
await api.post('/sentiment/feedback', {
  predictionId: 'pred-789',
  userLabel: 'negative',  // User says it should be negative
  userConfidence: 0.9
});
```

### 5. Frontend Integration (React)

```tsx
import { useSentimentAnalysis } from '@/hooks/use-sentiment';
import { SentimentBadge } from '@/components/sentiment/SentimentBadge';

function EmailView({ email }) {
  const { analyzeSentiment } = useSentimentAnalysis();
  const [sentiment, setSentiment] = useState(null);

  useEffect(() => {
    analyzeSentiment(email.body, 'email', email.contactId)
      .then(setSentiment);
  }, [email]);

  return (
    <div>
      <p>{email.body}</p>
      {sentiment && (
        <SentimentBadge 
          sentiment={sentiment.label}
          confidence={sentiment.confidence}
          showScore 
        />
      )}
    </div>
  );
}
```

## Migration from Legacy System

The system is backward compatible. Existing keyword-based configs are automatically migrated:

```sql
-- Migration runs automatically
INSERT INTO sentiment_configs (scope, mode, model_config, ...)
SELECT 'user', 'keyword', JSON_OBJECT('provider', 'keyword', ...), ...
FROM sentiment_config;
```

To enable advanced mode:
1. Navigate to `/outreach/sentiment-config`
2. Toggle "Advanced Mode" switch
3. Create or edit configurations with ML providers

## Monitoring & Operations

### Daily Metrics Calculation
Runs automatically at midnight:
```bash
npm run worker:sentiment-metrics
```

### Manual Drift Detection
```bash
curl -X POST http://localhost:8001/api/sentiment-configs/config-123/check-drift
```

### View Metrics Dashboard
```bash
curl http://localhost:8001/api/sentiment/metrics/config-123?days=30
```

### Export Configuration
```bash
curl http://localhost:8001/api/sentiment-configs/config-123 > config-backup.json
```

### Import Configuration
```typescript
const imported = JSON.parse(fs.readFileSync('config-backup.json'));
await api.post('/sentiment-configs', imported);
```

## Best Practices

### 1. Start with Keyword Mode
- Use keyword mode to establish baseline
- Collect predictions for 30+ days
- Review feedback before switching to ML

### 2. Gradual ML Rollout
- Create ML config at campaign or user scope first
- Monitor metrics daily
- Expand to workspace/global after validation

### 3. Threshold Tuning
- Start with default thresholds (0.35, 0.50, 0.65)
- Review false positives/negatives
- Adjust incrementally (±0.05)

### 4. Auto-Retrain Carefully
- Require human review for training data
- Set retrainThreshold to 100+ samples
- Enable drift detection with rollback

### 5. Monitor Performance
- Check processing time metrics weekly
- Alert on drift scores > 0.1
- Review audit logs for config changes

## Troubleshooting

### High Latency
- Check `processing_time_ms` metric
- Consider switching to faster model (gpt-4o-mini)
- Enable sampling to reduce storage overhead

### Poor Accuracy
- Review feedback corrections
- Increase `minConfidence` threshold
- Test with multiple providers

### Drift Alerts
- Compare recent vs baseline distributions
- Check for data quality issues
- Consider retraining or rollback

### Auto-Retrain Not Triggering
- Verify mode is 'ml' (not 'keyword')
- Check `retrainThreshold` setting
- Ensure feedback is approved (review_status='accepted')

## Security Considerations

- API keys stored encrypted in database
- RBAC checks on all config endpoints
- PII scrubbing before preview (configurable)
- Webhook URLs validated before use
- Rate limiting on prediction endpoints

## Performance

- Single prediction: ~200-500ms (OpenAI)
- Bulk prediction: ~2-5s for 100 items
- Daily metrics job: ~5-10min for 10k predictions
- Drift detection: ~1-2s per config

## Future Enhancements

- [ ] Multi-language support
- [ ] Custom derived metrics (urgency, tone scoring)
- [ ] A/B testing for model selection
- [ ] Explainability features (highlight keywords)
- [ ] Integration with lead scoring
- [ ] Automatic campaign segmentation based on sentiment

## Support

For issues or questions:
- Check logs: `backend/logs/app.log`
- Review audit trail: `GET /sentiment-configs/:id/audit`
- Contact: dev-team@xordon.com
