<?php

class AiService {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function generate(int $userId, array $payload): array {
        $channel = strtolower(trim($payload['channel'] ?? 'email'));
        
        if ($channel === 'image') {
            return $this->generateImage($userId, $payload);
        }

        $providerOverride = $payload['provider'] ?? null;
        $modelOverride = $payload['model'] ?? null;
        $messages = $payload['messages'] ?? null;
        $prompt = trim((string)($payload['prompt'] ?? ''));
        $action = $payload['action'] ?? 'draft';
        $temperature = isset($payload['temperature']) ? (float)$payload['temperature'] : 0.7;

        $settings = $this->getAiSettings($userId);
        $providerKey = $providerOverride ?: ($settings['channelDefaults'][$channel]['provider'] ?? $settings['defaultProvider']);
        if (!$providerKey) {
            throw new Exception('No AI provider configured. Please add one in settings.');
        }

        if (!isset($settings['providers'][$providerKey])) {
            throw new Exception(sprintf('AI provider "%s" is not configured.', $providerKey));
        }

        $provider = $settings['providers'][$providerKey];
        $apiKey = trim((string)($provider['apiKey'] ?? ''));
        if ($apiKey === '') {
            throw new Exception(sprintf('API key missing for provider "%s".', $providerKey));
        }

        $model = $modelOverride ?: ($settings['channelDefaults'][$channel]['model'] ?? $provider['model'] ?? 'gpt-4o-mini');
        $baseUrl = rtrim((string)($provider['baseUrl'] ?? 'https://api.openai.com/v1'), '/');
        $endpoint = $provider['endpoint'] ?? '/chat/completions';
        
        // Handle Gemini's different URL format
        if ($providerKey === 'gemini') {
            $url = $baseUrl . str_replace('{model}', $model, $endpoint);
        } else {
            $url = $baseUrl . $endpoint;
        }

        $systemPrompt = $payload['systemPrompt']
            ?? ($settings['channelDefaults'][$channel]['systemPrompt'] ?? $this->defaultSystemPrompt($channel, $action));

        // Handle different request formats for different providers
        if ($providerKey === 'gemini') {
            // Gemini uses different format
            $contents = [];
            
            if ($messages && is_array($messages) && count($messages) > 0) {
                foreach ($messages as $message) {
                    $contents[] = [
                        'role' => $message['role'] === 'system' ? 'user' : $message['role'],
                        'parts' => [['text' => $message['content']]]
                    ];
                }
            } else {
                $contentPrompt = $prompt !== '' ? $prompt : $this->defaultPromptFromAction($channel, $action);
                $contents = [
                    ['role' => 'user', 'parts' => [['text' => $systemPrompt . "\n\n" . $contentPrompt]]]
                ];
            }

            if (!empty($payload['context'])) {
                $contextText = 'Context: ' . (is_string($payload['context']) ? $payload['context'] : json_encode($payload['context']));
                $contents[] = ['role' => 'user', 'parts' => [['text' => $contextText]]];
            }

            $body = [
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => $temperature,
                ],
            ];
        } else {
            // OpenAI-compatible format
            $body = [
                'model' => $model,
                'temperature' => $temperature,
            ];

            if ($messages && is_array($messages) && count($messages) > 0) {
                $body['messages'] = $messages;
            } else {
                $contentPrompt = $prompt !== '' ? $prompt : $this->defaultPromptFromAction($channel, $action);
                $body['messages'] = [
                    [
                        'role' => 'system',
                        'content' => $systemPrompt,
                    ],
                    [
                        'role' => 'user',
                        'content' => $contentPrompt,
                    ],
                ];
            }

            if (!empty($payload['context'])) {
                $body['messages'][] = [
                    'role' => 'user',
                    'content' => 'Context: ' . (is_string($payload['context']) ? $payload['context'] : json_encode($payload['context'])),
                ];
            }
        }

        $responseData = $this->callProvider($url, $apiKey, $body, $providerKey);

        // Handle different response formats
        if ($providerKey === 'gemini') {
            if (!isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
                throw new Exception('Gemini returned an unexpected response.');
            }
            $content = $responseData['candidates'][0]['content']['parts'][0]['text'];
        } else {
            if (!isset($responseData['choices'][0]['message']['content'])) {
                throw new Exception('AI provider returned an unexpected response.');
            }
            $content = $responseData['choices'][0]['message']['content'];
        }

        return [
            'provider' => $providerKey,
            'model' => $model,
            'output' => trim($content),
            'usage' => $responseData['usage'] ?? null,
            'raw' => $responseData,
        ];
    }

    private function generateImage(int $userId, array $payload): array {
        $prompt = trim((string)($payload['prompt'] ?? ''));
        if (!$prompt) throw new Exception('Prompt is required for image generation');

        $settings = $this->getAiSettings($userId);
        
        // Currently only supporting OpenAI DALL-E for images
        // We could look up 'providers' to see if there's an 'image' capability, but for now hardcode logic to find OpenAI key.
        $providerKey = 'openai'; 
        $provider = $settings['providers'][$providerKey] ?? null;
        if (!$provider) throw new Exception('OpenAI provider not found in default config (required for DALL-E).');

        $apiKey = $provider['apiKey'];
        if (!$apiKey) throw new Exception('OpenAI API Key required for image generation');

        $url = 'https://api.openai.com/v1/images/generations';
        $body = [
            'prompt' => $prompt,
            'n' => 1,
            'size' => '1024x1024',
            'model' => 'dall-e-3', 
            'response_format' => 'url' 
        ];

        // Using callProvider might default to json content type which is fine.
        // But callProvider handles Bearer auth which is correct for OpenAI.
        
        $response = $this->callProvider($url, $apiKey, $body, 'openai');
        
        if (isset($response['data'][0]['url'])) {
             return [
                 'provider' => 'openai',
                 'model' => 'dall-e-3',
                 'output' => $response['data'][0]['url'], // The URL of the image
                 'usage' => null,
                 'raw' => $response
             ];
        } else {
             // Handle error
             $err = $response['error']['message'] ?? json_encode($response);
             throw new Exception('Image generation failed: ' . $err);
        }
    }

    private function getAiSettings(int $userId): array {
        $stmt = $this->pdo->prepare('SELECT data FROM settings WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $data = [];
        if ($row && isset($row['data'])) {
            $decoded = json_decode($row['data'], true);
            if (is_array($decoded)) {
                $data = $decoded;
            }
        }

        $defaults = self::baseConfig();
        $existing = $data['ai'] ?? [];
        if (!is_array($existing)) {
            $existing = [];
        }

        // Check for environment variable API keys if not set in database
        if (empty($existing['providers']['openai']['apiKey'])) {
            $envApiKey = getenv('OPENAI_API_KEY');
            if ($envApiKey) {
                $existing['providers']['openai']['apiKey'] = $envApiKey;
            }
        }
        
        if (empty($existing['providers']['gemini']['apiKey'])) {
            $envApiKey = getenv('GEMINI_API_KEY');
            if ($envApiKey) {
                $existing['providers']['gemini']['apiKey'] = $envApiKey;
            }
        }

        $merged = array_replace_recursive($defaults, $existing);

        foreach ($merged['channelDefaults'] as $channel => $conf) {
            if (empty($conf['provider']) || !isset($merged['providers'][$conf['provider']])) {
                $merged['channelDefaults'][$channel]['provider'] = $merged['defaultProvider'];
            }
            if (empty($merged['channelDefaults'][$channel]['model'])) {
                $providerKey = $merged['channelDefaults'][$channel]['provider'];
                $merged['channelDefaults'][$channel]['model'] = $merged['providers'][$providerKey]['model'] ?? 'gpt-4o-mini';
            }
        }

        return $merged;
    }

    public static function baseConfig(): array {
        return [
            'defaultProvider' => 'openai',
            'providers' => [
                'openai' => [
                    'label' => 'OpenAI / GPT',
                    'apiKey' => '',
                    'baseUrl' => 'https://api.openai.com/v1',
                    'endpoint' => '/chat/completions',
                    'model' => 'gpt-4o-mini',
                ],
                'openrouter' => [
                    'label' => 'OpenRouter',
                    'apiKey' => '',
                    'baseUrl' => 'https://openrouter.ai/api/v1',
                    'endpoint' => '/chat/completions',
                    'model' => 'gpt-4o-mini',
                ],
                'deepseek' => [
                    'label' => 'DeepSeek',
                    'apiKey' => '',
                    'baseUrl' => 'https://api.deepseek.com/v1',
                    'endpoint' => '/chat/completions',
                    'model' => 'deepseek-chat',
                ],
                'qwen' => [
                    'label' => 'Qwen',
                    'apiKey' => '',
                    'baseUrl' => 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                    'endpoint' => '/chat/completions',
                    'model' => 'qwen-plus',
                ],
                'gemini' => [
                    'label' => 'Google Gemini',
                    'apiKey' => '',
                    'baseUrl' => 'https://generativelanguage.googleapis.com/v1beta',
                    'endpoint' => '/models/{model}:generateContent',
                    'model' => 'gemini-1.5-flash',
                ],
            ],
            'channelDefaults' => [
                'email' => [
                    'provider' => 'openai',
                    'model' => 'gpt-4o-mini',
                ],
                'sms' => [
                    'provider' => 'openai',
                    'model' => 'gpt-4o-mini',
                ],
                'call' => [
                    'provider' => 'openai',
                    'model' => 'gpt-4o-mini',
                ],
                'form' => [
                    'provider' => 'openai',
                    'model' => 'gpt-4o-mini',
                ],
            ],
        ];
    }

    private function defaultSystemPrompt(string $channel, string $action): string {
        return match ($channel) {
            'sms' => 'You are an assistant that crafts compliant, concise SMS outreach messages. Keep replies under 300 characters and include opt-out hints when applicable.',
            'call' => 'You are an assistant that writes conversational call scripts and objection handling notes for sales reps.',
            'form' => 'You help create engaging form fields and questions to capture high-quality leads.',
            default => 'You are an expert email copywriter who writes high-converting, personalized outreach emails.',
        } . ' Focus on the requested action: ' . $action;
    }

    private function defaultPromptFromAction(string $channel, string $action): string {
        return sprintf('Generate %s content for %s channel.', $action, $channel);
    }

    private function callProvider(string $url, string $apiKey, array $body, string $providerKey): array {
        $ch = curl_init($url);
        $payload = json_encode($body, JSON_UNESCAPED_SLASHES);

        // Handle different authentication methods
        if ($providerKey === 'gemini') {
            // Gemini uses API key as query parameter
            $urlWithKey = $url . '?key=' . urlencode($apiKey);
            curl_setopt($ch, CURLOPT_URL, $urlWithKey);
            $headers = ['Content-Type: application/json'];
        } else {
            // Others use Bearer token
            $headers = [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ];
        }

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_TIMEOUT => 60,
        ]);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($error) {
            throw new Exception(sprintf('%s request failed: %s', ucfirst($providerKey), $error));
        }

        if ($response === false) {
            throw new Exception('Empty response from AI provider.');
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new Exception('Unable to parse AI response: ' . $response);
        }

        if ($status >= 400) {
            $errorMsg = $decoded['error']['message'] ?? 'Unknown API error';
            throw new Exception(sprintf('AI provider error (%d): %s', $status, $errorMsg));
        }

        return $decoded;
    }
}
