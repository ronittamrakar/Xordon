<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ABTestingController {
    
    // Get all A/B tests
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();

        try {
            $stmt = $pdo->prepare('
                SELECT t.*, 
                       (SELECT COUNT(*) FROM ab_test_variants WHERE test_id = t.id) as variant_count,
                       (SELECT COUNT(*) FROM ab_test_results WHERE test_id = t.id) as total_results
                FROM ab_tests t 
                WHERE t.user_id = ? 
                ORDER BY t.created_at DESC
            ');
            $stmt->execute([$userId]);

            Response::json(['items' => $stmt->fetchAll()]);
        } catch (PDOException $e) {
            $sqlState = $e->getCode();
            if ($sqlState === '42S02') {
                Response::json([
                    'items' => [],
                    'warning' => 'A/B testing tables are missing in the database. Please apply backend/migrations/add_ab_testing.sql.'
                ]);
                return;
            }
            Response::error('Failed to load A/B tests: ' . $e->getMessage(), 500);
        }
    }

    // Development helper: seed some sample A/B tests when DB is empty
    public static function devSeed(): void {
        if (getenv('APP_ENV') !== 'development') {
            Response::error('Not found', 404);
            return;
        }

        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();

        try {
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM ab_tests WHERE user_id = ?');
            $stmt->execute([$userId]);
            $count = (int)$stmt->fetchColumn();

            if ($count > 0) {
                Response::json(['success' => true, 'seeded' => 0]);
                return;
            }

            $pdo->beginTransaction();

            $seeded = 0;
            $tests = [
                [
                    'name' => 'Subject Line: Urgency vs Benefit',
                    'description' => 'Testing if urgency drives more opens than benefit-driven copy.',
                    'test_type' => 'email_subject',
                    'winner_criteria' => 'open_rate',
                    'status' => 'running',
                    'variants' => [
                        ['variant_name' => 'A', 'variant_label' => 'Control (Benefit)', 'is_control' => true, 'traffic_percentage' => 50, 'content' => ['subject' => 'Save 20% on your next order']],
                        ['variant_name' => 'B', 'variant_label' => 'Variant (Urgency)', 'is_control' => false, 'traffic_percentage' => 50, 'content' => ['subject' => 'Last chance! 20% off expires tonight']],
                    ],
                ],
                [
                    'name' => 'SMS Welcome Message',
                    'description' => 'Short vs personal greeting.',
                    'test_type' => 'sms_content',
                    'winner_criteria' => 'reply_rate',
                    'status' => 'draft',
                    'variants' => [
                        ['variant_name' => 'A', 'variant_label' => 'Short', 'is_control' => true, 'traffic_percentage' => 50, 'content' => ['body' => 'Welcome to Xordon! Start here: [Link]']],
                        ['variant_name' => 'B', 'variant_label' => 'Personal', 'is_control' => false, 'traffic_percentage' => 50, 'content' => ['body' => 'Hi {name}, thanks for joining Xordon! Start here: [Link]']],
                    ],
                ],
                [
                    'name' => 'CTA Button Text',
                    'description' => 'Buy Now vs Get Started.',
                    'test_type' => 'email_content',
                    'winner_criteria' => 'click_rate',
                    'status' => 'completed',
                    'variants' => [
                        ['variant_name' => 'A', 'variant_label' => 'Buy Now', 'is_control' => true, 'traffic_percentage' => 50, 'content' => ['body' => '...<button>Buy Now</button>']],
                        ['variant_name' => 'B', 'variant_label' => 'Get Started', 'is_control' => false, 'traffic_percentage' => 50, 'content' => ['body' => '...<button>Get Started</button>']],
                    ],
                ],
            ];

            foreach ($tests as $t) {
                $stmt = $pdo->prepare('
                    INSERT INTO ab_tests (user_id, client_id, name, description, test_type, entity_type, entity_id, status, winner_criteria, auto_select_winner, min_sample_size, test_duration_hours, created_at)
                    VALUES (?, NULL, ?, ?, ?, "campaign", 0, ?, ?, 1, 100, 24, NOW())
                ');
                $stmt->execute([
                    $userId,
                    $t['name'],
                    $t['description'],
                    $t['test_type'],
                    $t['status'],
                    $t['winner_criteria'],
                ]);

                $testId = (int)$pdo->lastInsertId();

                foreach ($t['variants'] as $v) {
                    $stmt = $pdo->prepare('
                        INSERT INTO ab_test_variants (test_id, variant_name, variant_label, content, traffic_percentage, is_control, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, NOW())
                    ');
                    $stmt->execute([
                        $testId,
                        $v['variant_name'],
                        $v['variant_label'],
                        json_encode($v['content']),
                        $v['traffic_percentage'],
                        $v['is_control'] ? 1 : 0,
                    ]);
                }

                $seeded++;
            }

            $pdo->commit();
            Response::json(['success' => true, 'seeded' => $seeded]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $sqlState = $e->getCode();
            if ($sqlState === '42S02') {
                Response::error('A/B testing tables are missing in the database. Please apply backend/migrations/add_ab_testing.sql.', 400);
                return;
            }
            Response::error('Failed to seed tests: ' . $e->getMessage(), 500);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            Response::error('Failed to seed tests: ' . $e->getMessage(), 500);
        }
    }
    
    // Get single test with variants and results
    public static function show(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM ab_tests WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $test = $stmt->fetch();
        
        if (!$test) {
            Response::error('Test not found', 404);
            return;
        }
        
        // Get variants with stats
        $stmt = $pdo->prepare('
            SELECT v.*,
                   (SELECT COUNT(*) FROM ab_test_results WHERE variant_id = v.id) as sent_count,
                   (SELECT COUNT(*) FROM ab_test_results WHERE variant_id = v.id AND opened_at IS NOT NULL) as open_count,
                   (SELECT COUNT(*) FROM ab_test_results WHERE variant_id = v.id AND clicked_at IS NOT NULL) as click_count,
                   (SELECT COUNT(*) FROM ab_test_results WHERE variant_id = v.id AND replied_at IS NOT NULL) as reply_count,
                   (SELECT COUNT(*) FROM ab_test_results WHERE variant_id = v.id AND converted_at IS NOT NULL) as conversion_count
            FROM ab_test_variants v
            WHERE v.test_id = ?
        ');
        $stmt->execute([$id]);
        $variants = $stmt->fetchAll();
        
        // Calculate rates
        foreach ($variants as &$v) {
            $sent = (int)$v['sent_count'];
            $v['open_rate'] = $sent > 0 ? round(($v['open_count'] / $sent) * 100, 2) : 0;
            $v['click_rate'] = $sent > 0 ? round(($v['click_count'] / $sent) * 100, 2) : 0;
            $v['reply_rate'] = $sent > 0 ? round(($v['reply_count'] / $sent) * 100, 2) : 0;
            $v['conversion_rate'] = $sent > 0 ? round(($v['conversion_count'] / $sent) * 100, 2) : 0;
        }
        
        $test['variants'] = $variants;
        
        Response::json($test);
    }
    
    // Create A/B test
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $name = trim($body['name'] ?? '');
        if (!$name) {
            Response::error('Test name is required', 422);
            return;
        }
        
        $pdo->beginTransaction();
        
        try {
            $stmt = $pdo->prepare('
                INSERT INTO ab_tests (user_id, client_id, name, description, test_type, entity_type, entity_id, status, winner_criteria, auto_select_winner, min_sample_size, test_duration_hours, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ');
            $stmt->execute([
                $userId,
                $body['client_id'] ?? null,
                $name,
                $body['description'] ?? null,
                $body['test_type'] ?? 'email_subject',
                $body['entity_type'] ?? 'campaign',
                $body['entity_id'] ?? 0,
                'draft',
                $body['winner_criteria'] ?? 'open_rate',
                $body['auto_select_winner'] ?? true,
                $body['min_sample_size'] ?? 100,
                $body['test_duration_hours'] ?? 24
            ]);
            
            $testId = (int)$pdo->lastInsertId();
            
            // Create variants
            $variants = $body['variants'] ?? [];
            if (count($variants) < 2) {
                // Create default A/B variants
                $variants = [
                    ['variant_name' => 'A', 'variant_label' => 'Control', 'is_control' => true, 'traffic_percentage' => 50],
                    ['variant_name' => 'B', 'variant_label' => 'Variant B', 'is_control' => false, 'traffic_percentage' => 50]
                ];
            }
            
            foreach ($variants as $v) {
                $stmt = $pdo->prepare('
                    INSERT INTO ab_test_variants (test_id, variant_name, variant_label, content, traffic_percentage, is_control, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                ');
                $stmt->execute([
                    $testId,
                    $v['variant_name'] ?? 'A',
                    $v['variant_label'] ?? '',
                    json_encode($v['content'] ?? []),
                    $v['traffic_percentage'] ?? 50,
                    $v['is_control'] ?? false
                ]);
            }
            
            $pdo->commit();
            
            // Return created test
            $stmt = $pdo->prepare('SELECT * FROM ab_tests WHERE id = ?');
            $stmt->execute([$testId]);
            $test = $stmt->fetch();
            
            $stmt = $pdo->prepare('SELECT * FROM ab_test_variants WHERE test_id = ?');
            $stmt->execute([$testId]);
            $test['variants'] = $stmt->fetchAll();
            
            Response::json($test, 201);
            
        } catch (PDOException $e) {
            $pdo->rollBack();
            // If migrations haven't been applied yet, MySQL will throw "Base table or view not found".
            // Return a helpful message instead of a generic 500.
            $sqlState = $e->getCode();
            if ($sqlState === '42S02') {
                Response::error('A/B testing tables are missing in the database. Please apply backend/migrations/add_ab_testing.sql.', 400);
                return;
            }
            Response::error('Failed to create test: ' . $e->getMessage(), 500);
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to create test: ' . $e->getMessage(), 500);
        }
    }
    
    // Update test
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM ab_tests WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            Response::error('Test not found', 404);
            return;
        }
        
        $stmt = $pdo->prepare('
            UPDATE ab_tests SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                winner_criteria = COALESCE(?, winner_criteria),
                auto_select_winner = COALESCE(?, auto_select_winner),
                min_sample_size = COALESCE(?, min_sample_size),
                test_duration_hours = COALESCE(?, test_duration_hours),
                updated_at = NOW()
            WHERE id = ? AND user_id = ?
        ');
        $stmt->execute([
            $body['name'] ?? null,
            $body['description'] ?? null,
            $body['winner_criteria'] ?? null,
            isset($body['auto_select_winner']) ? (int)$body['auto_select_winner'] : null,
            $body['min_sample_size'] ?? null,
            $body['test_duration_hours'] ?? null,
            $id,
            $userId
        ]);
        
        $stmt = $pdo->prepare('SELECT * FROM ab_tests WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($stmt->fetch());
    }
    
    // Start test
    public static function start(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            UPDATE ab_tests SET status = "running", started_at = NOW(), updated_at = NOW()
            WHERE id = ? AND user_id = ? AND status = "draft"
        ');
        $stmt->execute([$id, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Test not found or already started', 400);
            return;
        }
        
        Response::json(['success' => true, 'message' => 'Test started']);
    }
    
    // Stop test
    public static function stop(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            UPDATE ab_tests SET status = "completed", ended_at = NOW(), updated_at = NOW()
            WHERE id = ? AND user_id = ? AND status = "running"
        ');
        $stmt->execute([$id, $userId]);
        
        Response::json(['success' => true, 'message' => 'Test stopped']);
    }
    
    // Select winner
    public static function selectWinner(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $variantId = $body['variant_id'] ?? null;
        if (!$variantId) {
            Response::error('Variant ID is required', 422);
            return;
        }
        
        $pdo->beginTransaction();
        
        try {
            // Update test
            $stmt = $pdo->prepare('
                UPDATE ab_tests SET status = "winner_selected", winner_variant_id = ?, ended_at = NOW(), updated_at = NOW()
                WHERE id = ? AND user_id = ?
            ');
            $stmt->execute([$variantId, $id, $userId]);
            
            // Mark variant as winner
            $stmt = $pdo->prepare('UPDATE ab_test_variants SET is_winner = FALSE WHERE test_id = ?');
            $stmt->execute([$id]);
            
            $stmt = $pdo->prepare('UPDATE ab_test_variants SET is_winner = TRUE WHERE id = ? AND test_id = ?');
            $stmt->execute([$variantId, $id]);
            
            $pdo->commit();
            
            Response::json(['success' => true, 'message' => 'Winner selected']);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to select winner', 500);
        }
    }
    
    // Delete test
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('DELETE FROM ab_tests WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        
        Response::json(['success' => true]);
    }
    
    // Update variant
    public static function updateVariant(string $testId, string $variantId): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Verify ownership
        $stmt = $pdo->prepare('SELECT id FROM ab_tests WHERE id = ? AND user_id = ?');
        $stmt->execute([$testId, $userId]);
        if (!$stmt->fetch()) {
            Response::error('Test not found', 404);
            return;
        }
        
        $stmt = $pdo->prepare('
            UPDATE ab_test_variants SET
                variant_label = COALESCE(?, variant_label),
                content = COALESCE(?, content),
                traffic_percentage = COALESCE(?, traffic_percentage)
            WHERE id = ? AND test_id = ?
        ');
        $stmt->execute([
            $body['variant_label'] ?? null,
            isset($body['content']) ? json_encode($body['content']) : null,
            $body['traffic_percentage'] ?? null,
            $variantId,
            $testId
        ]);
        
        $stmt = $pdo->prepare('SELECT * FROM ab_test_variants WHERE id = ?');
        $stmt->execute([$variantId]);
        
        Response::json($stmt->fetch());
    }
}
