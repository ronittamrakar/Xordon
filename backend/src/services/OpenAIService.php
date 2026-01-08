<?php

namespace Xordon\Services;

/**
 * OpenAI Integration Service
 * Handles AI content generation and sentiment analysis
 */
class OpenAIService {
    
    private $apiKey;
    private $model;
    private $baseUrl = 'https://api.openai.com/v1';
    
    public function __construct() {
        $this->apiKey = getenv('OPENAI_API_KEY') ?: '';
        $this->model = getenv('OPENAI_MODEL') ?: 'gpt-4';
    }
    
    /**
     * Generate content using OpenAI
     */
    public function generateContent($contentType, $prompt, $context = []) {
        if (empty($this->apiKey)) {
            // Fallback to mock if no API key
            return $this->mockGenerate($contentType, $prompt);
        }
        
        try {
            $systemPrompt = $this->getSystemPrompt($contentType);
            
            $messages = [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $prompt]
            ];
            
            // Add context if provided
            if (!empty($context)) {
                $contextStr = "Context: " . json_encode($context);
                $messages[] = ['role' => 'user', 'content' => $contextStr];
            }
            
            $response = $this->makeRequest('/chat/completions', [
                'model' => $this->model,
                'messages' => $messages,
                'max_tokens' => $this->getMaxTokens($contentType),
                'temperature' => 0.7,
            ]);
            
            if (isset($response['choices'][0]['message']['content'])) {
                return [
                    'content' => $response['choices'][0]['message']['content'],
                    'tokens' => $response['usage']['total_tokens'] ?? 0,
                    'model' => $this->model
                ];
            }
            
            throw new \Exception('Invalid response from OpenAI');
            
        } catch (\Exception $e) {
            error_log('OpenAI Error: ' . $e->getMessage());
            // Fallback to mock
            return $this->mockGenerate($contentType, $prompt);
        }
    }
    
    /**
     * Analyze sentiment using OpenAI
     */
    public function analyzeSentiment($text) {
        if (empty($this->apiKey)) {
            return $this->mockSentiment($text);
        }
        
        try {
            $prompt = "Analyze the sentiment of the following text and respond with ONLY a JSON object containing: sentiment (positive/neutral/negative), score (0-1), emotions (object with emotion names and scores), and keywords (array of important keywords).\n\nText: " . $text;
            
            $response = $this->makeRequest('/chat/completions', [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a sentiment analysis expert. Always respond with valid JSON only.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 300,
                'temperature' => 0.3,
            ]);
            
            $content = $response['choices'][0]['message']['content'] ?? '';
            $analysis = json_decode($content, true);
            
            if ($analysis && isset($analysis['sentiment'])) {
                return $analysis;
            }
            
            throw new \Exception('Invalid sentiment response');
            
        } catch (\Exception $e) {
            error_log('Sentiment Analysis Error: ' . $e->getMessage());
            return $this->mockSentiment($text);
        }
    }
    
    /**
     * Make HTTP request to OpenAI API
     */
    private function makeRequest($endpoint, $data) {
        $ch = curl_init($this->baseUrl . $endpoint);
        
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey
            ],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new \Exception('OpenAI API returned status ' . $httpCode);
        }
        
        $decoded = json_decode($response, true);
        if (!$decoded) {
            throw new \Exception('Failed to decode OpenAI response');
        }
        
        return $decoded;
    }
    
    /**
     * Get system prompt for content type
     */
    private function getSystemPrompt($contentType) {
        $prompts = [
            'email' => 'You are a professional email copywriter. Write engaging, clear, and persuasive email content that drives action. Keep it concise and focused.',
            'subject_line' => 'You are an expert at writing compelling email subject lines. Create attention-grabbing subject lines that increase open rates. Keep them under 60 characters.',
            'sms' => 'You are an SMS marketing expert. Write concise, impactful messages under 160 characters that drive immediate action.',
            'social' => 'You are a social media content creator. Write engaging posts optimized for social platforms with appropriate hashtags and emojis.',
            'blog' => 'You are a professional blog writer. Create informative, engaging content that provides value to readers.',
            'ad_copy' => 'You are an advertising copywriter. Write compelling ad copy that converts viewers into customers.'
        ];
        
        return $prompts[$contentType] ?? 'You are a helpful marketing content writer.';
    }
    
    /**
     * Get max tokens for content type
     */
    private function getMaxTokens($contentType) {
        $limits = [
            'subject_line' => 50,
            'sms' => 100,
            'social' => 200,
            'email' => 500,
            'ad_copy' => 300,
            'blog' => 1000
        ];
        
        return $limits[$contentType] ?? 500;
    }
    
    /**
     * Mock content generation (fallback)
     */
    private function mockGenerate($contentType, $prompt) {
        $templates = [
            'email' => "Subject: {$prompt}\n\nDear valued customer,\n\nThank you for your interest. Based on your needs, we'd like to share some exciting opportunities with you.\n\nBest regards,\nYour Team",
            'subject_line' => "🔥 {$prompt} - Limited Time Offer!",
            'sms' => "Hi! {$prompt} - Reply YES to learn more.",
            'social' => "🎉 {$prompt} Check out our latest updates! #business #growth",
            'blog' => "# {$prompt}\n\nThis is an engaging blog post about {$prompt}. It provides valuable insights and actionable tips.",
            'ad_copy' => "{$prompt} - Get started today! Limited time offer."
        ];
        
        return [
            'content' => $templates[$contentType] ?? "Generated content for: {$prompt}",
            'tokens' => strlen($prompt) / 4,
            'model' => 'mock'
        ];
    }
    
    /**
     * Mock sentiment analysis (fallback)
     */
    private function mockSentiment($text) {
        $positiveWords = ['great', 'excellent', 'amazing', 'love', 'best', 'wonderful', 'fantastic'];
        $negativeWords = ['bad', 'terrible', 'worst', 'hate', 'awful', 'poor', 'horrible'];
        
        $textLower = strtolower($text);
        $positiveCount = 0;
        $negativeCount = 0;
        
        foreach ($positiveWords as $word) {
            if (strpos($textLower, $word) !== false) $positiveCount++;
        }
        
        foreach ($negativeWords as $word) {
            if (strpos($textLower, $word) !== false) $negativeCount++;
        }
        
        if ($positiveCount > $negativeCount) {
            $sentiment = 'positive';
            $score = 0.7 + ($positiveCount * 0.1);
        } elseif ($negativeCount > $positiveCount) {
            $sentiment = 'negative';
            $score = 0.3 - ($negativeCount * 0.1);
        } else {
            $sentiment = 'neutral';
            $score = 0.5;
        }
        
        $score = max(0, min(1, $score));
        
        return [
            'sentiment' => $sentiment,
            'score' => $score,
            'emotions' => [
                'joy' => $positiveCount > 0 ? 0.6 : 0.2,
                'trust' => 0.4,
                'anticipation' => 0.3
            ],
            'keywords' => ['service', 'quality', 'experience']
        ];
    }
}
