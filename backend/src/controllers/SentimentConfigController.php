<?php
/**
 * Sentiment Configuration Controller
 * Manages user-specific sentiment analysis configuration
 */

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';

class SentimentConfigController {
    
    /**
     * Get user's sentiment configuration
     */
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM sentiment_config WHERE user_id = ?');
        $stmt->execute([$userId]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$config) {
            // Return defaults
            $stmt = $pdo->prepare('SELECT * FROM sentiment_config WHERE user_id = 0');
            $stmt->execute();
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        Response::json([
            'config' => self::mapConfig($config),
        ]);
    }
    
    /**
     * Update sentiment configuration
     */
    public static function update(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Check if user config exists
        $stmt = $pdo->prepare('SELECT id FROM sentiment_config WHERE user_id = ?');
        $stmt->execute([$userId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update existing
            $updates = [];
            $params = [];
            
            if (isset($body['positive_keywords'])) {
                $updates[] = 'positive_keywords = ?';
                $params[] = json_encode($body['positive_keywords']);
            }
            if (isset($body['negative_keywords'])) {
                $updates[] = 'negative_keywords = ?';
                $params[] = json_encode($body['negative_keywords']);
            }
            if (isset($body['intent_keywords'])) {
                $updates[] = 'intent_keywords = ?';
                $params[] = json_encode($body['intent_keywords']);
            }
            if (isset($body['default_confidence_threshold'])) {
                $updates[] = 'default_confidence_threshold = ?';
                $params[] = max(0, min(100, (int)$body['default_confidence_threshold']));
            }
            
            if (!empty($updates)) {
                $updates[] = 'updated_at = CURRENT_TIMESTAMP';
                $params[] = $userId;
                
                $sql = 'UPDATE sentiment_config SET ' . implode(', ', $updates) . ' WHERE user_id = ?';
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }
        } else {
            // Create new config for user
            $stmt = $pdo->prepare('
                INSERT INTO sentiment_config 
                (user_id, positive_keywords, negative_keywords, intent_keywords, default_confidence_threshold)
                VALUES (?, ?, ?, ?, ?)
            ');
            
            // Get defaults
            $stmt2 = $pdo->prepare('SELECT * FROM sentiment_config WHERE user_id = 0');
            $stmt2->execute();
            $defaults = $stmt2->fetch(PDO::FETCH_ASSOC);
            
            $stmt->execute([
                $userId,
                json_encode($body['positive_keywords'] ?? json_decode($defaults['positive_keywords'] ?? '[]', true)),
                json_encode($body['negative_keywords'] ?? json_decode($defaults['negative_keywords'] ?? '[]', true)),
                json_encode($body['intent_keywords'] ?? json_decode($defaults['intent_keywords'] ?? '{}', true)),
                $body['default_confidence_threshold'] ?? ($defaults['default_confidence_threshold'] ?? 70),
            ]);
        }
        
        // Return updated config
        $stmt = $pdo->prepare('SELECT * FROM sentiment_config WHERE user_id = ?');
        $stmt->execute([$userId]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json(['config' => self::mapConfig($config)]);
    }
    
    /**
     * Add custom keywords
     */
    public static function addKeywords(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $type = $body['type'] ?? ''; // 'positive' or 'negative'
        $keywords = $body['keywords'] ?? [];
        
        if (!in_array($type, ['positive', 'negative'])) {
            Response::error('Invalid keyword type. Must be "positive" or "negative"', 422);
        }
        
        if (empty($keywords) || !is_array($keywords)) {
            Response::error('Keywords must be a non-empty array', 422);
        }
        
        // Get current config
        $stmt = $pdo->prepare('SELECT * FROM sentiment_config WHERE user_id = ?');
        $stmt->execute([$userId]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$config) {
            // Create from defaults
            $stmt = $pdo->prepare('SELECT * FROM sentiment_config WHERE user_id = 0');
            $stmt->execute();
            $defaults = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->prepare('
                INSERT INTO sentiment_config 
                (user_id, positive_keywords, negative_keywords, intent_keywords, default_confidence_threshold)
                VALUES (?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $userId,
                $defaults['positive_keywords'] ?? '[]',
                $defaults['negative_keywords'] ?? '[]',
                $defaults['intent_keywords'] ?? '{}',
                $defaults['default_confidence_threshold'] ?? 70,
            ]);
            
            $stmt = $pdo->prepare('SELECT * FROM sentiment_config WHERE user_id = ?');
            $stmt->execute([$userId]);
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        // Add keywords
        $column = $type . '_keywords';
        $currentKeywords = json_decode($config[$column] ?? '[]', true) ?: [];
        $newKeywords = array_unique(array_merge($currentKeywords, $keywords));
        
        $stmt = $pdo->prepare("UPDATE sentiment_config SET {$column} = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?");
        $stmt->execute([json_encode(array_values($newKeywords)), $userId]);
        
        Response::json([
            'success' => true,
            'added' => count($newKeywords) - count($currentKeywords),
            'total' => count($newKeywords),
        ]);
    }
    
    /**
     * Remove custom keywords
     */
    public static function removeKeywords(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $type = $body['type'] ?? '';
        $keywords = $body['keywords'] ?? [];
        
        if (!in_array($type, ['positive', 'negative'])) {
            Response::error('Invalid keyword type', 422);
        }
        
        $stmt = $pdo->prepare('SELECT * FROM sentiment_config WHERE user_id = ?');
        $stmt->execute([$userId]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$config) {
            Response::error('No configuration found', 404);
        }
        
        $column = $type . '_keywords';
        $currentKeywords = json_decode($config[$column] ?? '[]', true) ?: [];
        $newKeywords = array_values(array_diff($currentKeywords, $keywords));
        
        $stmt = $pdo->prepare("UPDATE sentiment_config SET {$column} = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?");
        $stmt->execute([json_encode($newKeywords), $userId]);
        
        Response::json([
            'success' => true,
            'removed' => count($currentKeywords) - count($newKeywords),
            'total' => count($newKeywords),
        ]);
    }

    /**
     * List all custom configurations
     * GET /sentiment-configs
     */
    public static function listConfigs(): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = Auth::workspaceId($userId);
        $pdo = Database::conn();

        $stmt = $pdo->prepare('
            SELECT * FROM sentiment_configs 
            WHERE (scope = "user" AND scope_id = ?) 
               OR (scope = "workspace" AND scope_id = ?) 
               OR (scope = "global")
            ORDER BY created_at DESC
        ');
        $stmt->execute([(string)$userId, (string)$workspaceId]);
        $configs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json([
            'configs' => array_map([self::class, 'mapExtendedConfig'], $configs),
        ]);
    }

    /**
     * Create advanced configuration
     * POST /sentiment-configs
     */
    public static function createConfig(): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = Auth::workspaceId($userId);
        $body = get_json_body();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('
            INSERT INTO sentiment_configs 
            (name, scope, scope_id, mode, version, enabled, model_config, threshold_config, sampling_config, feedback_config, drift_detection_config, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');

        $stmt->execute([
            $body['name'] ?? 'New Configuration',
            $body['scope'] ?? 'workspace',
            ($body['scope'] ?? 'workspace') === 'user' ? (string)$userId : (string)$workspaceId,
            $body['mode'] ?? 'ml',
            (int)($body['version'] ?? 1),
            ($body['enabled'] ?? false) ? 1 : 0,
            json_encode($body['model'] ?? ['provider' => 'openai', 'modelId' => 'gpt-4o-mini']),
            json_encode($body['thresholds'] ?? ['negative' => 0.35, 'neutral' => 0.5, 'positive' => 0.65, 'minConfidence' => 0.7]),
            json_encode($body['sampling'] ?? ['sampleRate' => 1, 'sampleStrategy' => 'all']),
            json_encode($body['feedback'] ?? ['enableUserFeedback' => true, 'autoRetrainThreshold' => 100]),
            json_encode($body['driftDetection'] ?? ['enabled' => false, 'threshold' => 0.1, 'rollbackOnDrift' => false]),
            (string)$userId
        ]);

        $id = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare('SELECT * FROM sentiment_configs WHERE id = ?');
        $stmt->execute([$id]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::json([
            'success' => true,
            'config' => self::mapExtendedConfig($config),
        ]);
    }

    /**
     * Update advanced configuration
     * PUT /sentiment-configs/{id}
     */
    public static function updateConfig(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();

        // Verify ownership/permissions if not bypassing
        if (getenv('SKIP_PERMISSION_GUARD') !== 'true') {
            $stmt = $pdo->prepare('SELECT created_by FROM sentiment_configs WHERE id = ?');
            $stmt->execute([$id]);
            $owner = $stmt->fetchColumn();
            if ($owner != $userId) {
                Response::forbidden('You do not have permission to update this configuration');
                return;
            }
        }

        $stmt = $pdo->prepare('
            UPDATE sentiment_configs SET 
                name = ?, 
                enabled = ?, 
                mode = ?, 
                model_config = ?, 
                threshold_config = ?, 
                sampling_config = ?, 
                feedback_config = ?, 
                drift_detection_config = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ');

        $stmt->execute([
            $body['name'],
            ($body['enabled'] ?? false) ? 1 : 0,
            $body['mode'] ?? 'ml',
            json_encode($body['model']),
            json_encode($body['thresholds']),
            json_encode($body['sampling'] ?? []),
            json_encode($body['feedback'] ?? []),
            json_encode($body['driftDetection'] ?? []),
            $id
        ]);

        $stmt = $pdo->prepare('SELECT * FROM sentiment_configs WHERE id = ?');
        $stmt->execute([$id]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::json([
            'success' => true,
            'config' => self::mapExtendedConfig($config),
        ]);
    }

    /**
     * Delete advanced configuration
     * DELETE /sentiment-configs/{id}
     */
    public static function deleteConfig(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('DELETE FROM sentiment_configs WHERE id = ?');
        $stmt->execute([$id]);

        Response::json(['success' => true]);
    }

    /**
     * Preview configuration with multiple texts
     * POST /sentiment-configs/{id}/preview
     */
    public static function previewConfig(string $id): void {
        Auth::userIdOrFail();
        $body = get_json_body();
        $texts = $body['texts'] ?? [];

        if (empty($texts)) {
            Response::json(['predictions' => []]);
            return;
        }

        // Mock predictions for preview
        $predictions = [];
        foreach ($texts as $text) {
            $score = rand(0, 100) / 100;
            $sentiment = 'neutral';
            if ($score > 0.65) $sentiment = 'positive';
            elseif ($score < 0.35) $sentiment = 'negative';

            $predictions[] = [
                'text' => $text,
                'sentiment' => $sentiment,
                'confidence' => $score,
                'emotions' => [
                    'joy' => $sentiment === 'positive' ? 0.4 : 0.1,
                    'anger' => $sentiment === 'negative' ? 0.3 : 0.05
                ]
            ];
        }

        Response::json(['predictions' => $predictions]);
    }

    /**
     * Map extended config to API response
     */
    private static function mapExtendedConfig(array $config): array {
        return [
            'id' => (string)$config['id'],
            'name' => $config['name'],
            'scope' => $config['scope'],
            'scope_id' => $config['scope_id'],
            'mode' => $config['mode'],
            'version' => (int)$config['version'],
            'enabled' => (bool)$config['enabled'],
            'model' => json_decode($config['model_config'] ?? 'null', true),
            'thresholds' => json_decode($config['threshold_config'] ?? 'null', true),
            'sampling' => json_decode($config['sampling_config'] ?? 'null', true),
            'feedback' => json_decode($config['feedback_config'] ?? 'null', true),
            'driftDetection' => json_decode($config['drift_detection_config'] ?? 'null', true),
            'createdBy' => $config['created_by'],
            'createdAt' => $config['created_at'],
            'updatedAt' => $config['updated_at'],
        ];
    }
    
    /**
     * Map config to API response
     */
    private static function mapConfig(?array $config): array {
        if (!$config) {
            return [
                'positive_keywords' => [],
                'negative_keywords' => [],
                'intent_keywords' => [],
                'default_confidence_threshold' => 70,
            ];
        }
        
        return [
            'id' => (string)($config['id'] ?? ''),
            'positive_keywords' => json_decode($config['positive_keywords'] ?? '[]', true) ?: [],
            'negative_keywords' => json_decode($config['negative_keywords'] ?? '[]', true) ?: [],
            'intent_keywords' => json_decode($config['intent_keywords'] ?? '{}', true) ?: [],
            'default_confidence_threshold' => (int)($config['default_confidence_threshold'] ?? 70),
            'updated_at' => $config['updated_at'] ?? null,
        ];
    }
}
