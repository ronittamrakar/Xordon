<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class AiAgentsController {
    public static function listAgents(): void {
        $userId = Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT id, user_id, name, type, config, status, created_at, updated_at FROM ai_agents WHERE user_id = ?');
            $stmt->execute([$userId]);
            $agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Decode config JSON
            foreach ($agents as &$agent) {
                if (isset($agent['config']) && is_string($agent['config'])) {
                    $agent['config'] = json_decode($agent['config'], true) ?: [];
                }
            }
            
            Response::json([ 'success' => true, 'items' => $agents ]);
        } catch (Throwable $e) {
            Response::error('Failed to fetch AI agents: ' . $e->getMessage(), 500);
        }
    }

    public static function getAgent(string $id): void {
        $userId = Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT id, user_id, name, type, config, status, created_at, updated_at FROM ai_agents WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, $userId]);
            $agent = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$agent) { Response::notFound('Agent not found'); return; }
            
            if (isset($agent['config']) && is_string($agent['config'])) {
                $agent['config'] = json_decode($agent['config'], true) ?: [];
            }

            Response::json([ 'success' => true, 'data' => $agent ]);
        } catch (Throwable $e) {
            Response::error('Failed to fetch agent: ' . $e->getMessage(), 500);
        }
    }

    public static function createAgent(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        if (!is_array($body) || empty(trim((string)($body['name'] ?? '')))) {
            Response::json(['error' => 'Invalid payload (missing name)'], 400);
            return;
        }

        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('INSERT INTO ai_agents (user_id, name, type, config, status) VALUES (?, ?, ?, ?, ?)');
            $config = isset($body['config']) ? json_encode($body['config']) : null;
            $type = isset($body['type']) ? (string)$body['type'] : 'chat';
            $status = isset($body['status']) ? (string)$body['status'] : 'active';
            $stmt->execute([$userId, trim((string)$body['name']), $type, $config, $status]);
            $id = (string)$pdo->lastInsertId();
            Response::json(['success' => true, 'id' => $id]);
        } catch (Throwable $e) {
            Response::error('Failed to create agent: ' . $e->getMessage(), 500);
        }
    }

    public static function updateAgent(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        if (!is_array($body)) {
            Response::json(['error' => 'Invalid payload'], 400);
            return;
        }

        try {
            $pdo = Database::conn();
            // Ensure record belongs to user
            $stmt = $pdo->prepare('SELECT id FROM ai_agents WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, $userId]);
            $exists = $stmt->fetchColumn();
            if (!$exists) { Response::notFound('Agent not found'); return; }

            $fields = [];
            $params = [];

            if (isset($body['name'])) { $fields[] = 'name = ?'; $params[] = trim((string)$body['name']); }
            if (isset($body['type'])) { $fields[] = 'type = ?'; $params[] = (string)$body['type']; }
            // Ensure config is encoded if it's an array/object
            if (array_key_exists('config', $body)) { 
                $fields[] = 'config = ?'; 
                $params[] = is_string($body['config']) ? $body['config'] : json_encode($body['config']); 
            }
            if (isset($body['status'])) { $fields[] = 'status = ?'; $params[] = (string)$body['status']; }

            if (count($fields) === 0) {
                Response::json(['success' => true]);
                return;
            }

            $params[] = $id;
            $params[] = $userId;
            $sql = 'UPDATE ai_agents SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            Response::json(['success' => true]);
        } catch (Throwable $e) {
            Response::error('Failed to update agent: ' . $e->getMessage(), 500);
        }
    }

    public static function deleteAgent(string $id): void {
        $userId = Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('DELETE FROM ai_agents WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, $userId]);
            Response::json(['success' => true]);
        } catch (Throwable $e) {
            Response::error('Failed to delete agent: ' . $e->getMessage(), 500);
        }
    }
    public static function getTemplates(): void {
        try {
            $pdo = Database::conn();
            $templates = [];
            
            try {
                $stmt = $pdo->query("SELECT * FROM ai_templates ORDER BY downloads DESC");
                $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Throwable $e) {
                // Table might not exist
            }
            
            if (empty($templates)) {
                 $templates = self::getHardcodedTemplates();
            } else {
                 foreach ($templates as &$t) {
                     $t['business_niches'] = json_decode($t['business_niches'] ?? '[]', true) ?: [];
                     $t['use_cases'] = json_decode($t['use_cases'] ?? '[]', true) ?: [];
                     $t['config'] = json_decode($t['config'] ?? '[]', true) ?: [];
                     $t['is_official'] = (bool)$t['is_official'];
                     $t['is_verified'] = (bool)$t['is_verified'];
                     // Ensure IDs are strings for consistency with frontend expectations
                     $t['id'] = (string)$t['id'];
                 }
            }

            Response::json($templates);
        } catch (Throwable $e) {
             // Absolute fallback
             Response::json(self::getHardcodedTemplates());
        }
    }

    public static function useTemplate(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        try {
            $pdo = Database::conn();
            $template = null;
            
            // Try fetch from DB
            try {
                $stmt = $pdo->prepare("SELECT * FROM ai_templates WHERE id = ?");
                $stmt->execute([$id]);
                $dbTemplate = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($dbTemplate) {
                     $template = $dbTemplate;
                     $template['config'] = json_decode($template['config'] ?? '[]', true);
                     $template['type'] = $template['type'] ?? 'chat';
                }
            } catch (Throwable $e) { /* ignore */ }
            
            // Fallback to hardcoded
            if (!$template) {
                foreach (self::getHardcodedTemplates() as $t) {
                    if ($t['id'] === $id) {
                        $template = $t;
                        break;
                    }
                }
            }
            
            if (!$template) {
                Response::notFound('Template not found');
                return;
            }

            // Determine Agent Name
            $inputName = trim((string)($body['name'] ?? ''));
            $name = $inputName ?: $template['name'];

            // Prepare Config
            $config = $template['config'] ?? [];
            if (empty($config)) {
                 $config = [
                     'system_prompt' => "You are {$template['name']}. {$template['description']}",
                     'model' => 'gpt-4o-mini'
                 ];
            }
            
            $stmt = $pdo->prepare('INSERT INTO ai_agents (user_id, name, type, config, status) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([
                $userId, 
                $name, 
                $template['type'], 
                json_encode($config), 
                'active'
            ]);
            
            $newId = $pdo->lastInsertId();
            Response::json(['success' => true, 'id' => (string)$newId]);
        } catch (Throwable $e) {
            Response::error('Failed to create agent from template: ' . $e->getMessage(), 500);
        }
    }

    // Admin/Management methods (Placeholder for future UI)
    public static function createTemplate(): void {
        // Implementation for creating new templates via API
        // For now, manual SQL seeding is expected
        Response::error('Not implemented', 501);
    }

    private static function getHardcodedTemplates(): array {
        return [
            [
                'id' => '1',
                'name' => 'Abigail - Global Support Unit',
                'description' => 'A high-performance conversational unit engineered for complex multi-lingual support and sentiment-aware interaction.',
                'category' => 'Customer Excellence',
                'author' => 'Neural Systems',
                'type' => 'chat',
                'business_niches' => ['Agency', 'SaaS', 'E-commerce'],
                'use_cases' => ['Global Support', 'Sentiment Analysis'],
                'downloads' => 42100,
                'rating' => 4.9,
                'reviews_count' => 128,
                'price' => 'Free',
                'image_url' => 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                'is_official' => true,
                'is_verified' => true,
                'config' => ['role' => 'support', 'tone' => 'empathetic']
            ],
            [
                'id' => '2',
                'name' => 'Bio-Medical Appointment Node',
                'description' => 'A precision-tuned scheduling engine designed for medical environments requiring strict compliance and complex booking logic.',
                'category' => 'Health & Sciences',
                'author' => 'MedTech AI',
                'type' => 'chat',
                'business_niches' => ['Medical Clinic', 'Surgical Centers'],
                'use_cases' => ['Critical Scheduling', 'Patient Triage'],
                'downloads' => 31400,
                'rating' => 4.8,
                'reviews_count' => 94,
                'price' => 'Premium',
                'image_url' => 'https://cdn-icons-png.flaticon.com/512/3467/3467831.png',
                'is_official' => true,
                'is_verified' => true,
                'config' => ['role' => 'scheduler', 'domain' => 'medical']
            ],
        ];
    }

    public static function simulateChat(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $message = $body['message'] ?? '';
        $config = $body['config'] ?? [];

        if (empty($message)) {
            Response::json(['error' => 'Message is required'], 400);
            return;
        }

        // Simulate a response
        // In a real scenario, this would call OpenAI or another LLM service
        // using the $config to set system prompts, tone, etc.
        
        $responses = [
            "I understand you're interested in that. Could you tell me more?",
            "That's a great question! Based on my training, I can tell you...",
            "I'm here to help with exactly that kind of inquiry.",
            "Let me check the details for you...",
        ];
        
        $randomResponse = $responses[array_rand($responses)];
        
        if (isset($config['tone'])) {
            $tone = $config['tone'];
            if ($tone === 'Friendly') $randomResponse = "Hey there! " . $randomResponse;
            if ($tone === 'Professional') $randomResponse = "Certainly. " . $randomResponse;
        }

        // Add a small delay to simulate processing
        usleep(500000); // 0.5s

        Response::json([
            'success' => true,
            'response' => $randomResponse, 
            'context_used' => isset($config['context']) ? true : false
        ]);
    }
}

