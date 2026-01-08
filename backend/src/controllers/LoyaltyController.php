<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';

class LoyaltyController {
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }

    public static function getStats(): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            // Total points issued
            $stmt = $pdo->prepare("SELECT SUM(points) as total FROM loyalty_transactions WHERE {$scope['col']} = ? AND type IN ('earn', 'bonus')");
            $stmt->execute([$scope['val']]);
            $totalEarned = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

            // Total points redeemed
            $stmt = $pdo->prepare("SELECT SUM(ABS(points)) as total FROM loyalty_transactions WHERE {$scope['col']} = ? AND type = 'redeem'");
            $stmt->execute([$scope['val']]);
            $totalRedeemed = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

            // Active customers enrollment
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM loyalty_points WHERE {$scope['col']} = ?");
            $stmt->execute([$scope['val']]);
            $enrolledCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

            Response::json([
                'total_earned' => (int)$totalEarned,
                'total_redeemed' => (int)$totalRedeemed,
                'enrolled_customers' => (int)$enrolledCount
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function getProgram(): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT * FROM loyalty_programs WHERE {$scope['col']} = ?");
            $stmt->execute([$scope['val']]);
            $program = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$program) {
                Response::json([
                    'name' => 'Default Program',
                    'points_to_currency_ratio' => 1.0,
                    'is_active' => false
                ]);
                return;
            }
            Response::json($program);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function getRewards(): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT * FROM loyalty_rewards WHERE {$scope['col']} = ?");
            $stmt->execute([$scope['val']]);
            Response::json($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function updateProgram(): void {
        Auth::userIdOrFail();
        try {
            $b = get_json_body();
            $pdo = Database::conn();
            $userId = Auth::userId();
            $workspaceId = ($GLOBALS['tenantContext'] ?? null)?->workspaceId ?? null;
            $scope = self::getWorkspaceScope();
            
            $stmt = $pdo->prepare("SELECT id FROM loyalty_programs WHERE {$scope['col']} = ?");
            $stmt->execute([$scope['val']]);
            $exists = $stmt->fetch();
            
            if ($exists) {
                $allowedFields = ['name', 'description', 'points_to_currency_ratio', 'signup_bonus', 'birthday_bonus', 'is_active'];
                $updates = [];
                $params = [];
                foreach ($allowedFields as $field) {
                    if (array_key_exists($field, $b)) {
                        $updates[] = "$field = ?";
                        $params[] = $b[$field];
                    }
                }
                
                if (!empty($updates)) {
                    $sql = "UPDATE loyalty_programs SET " . implode(', ', $updates) . " WHERE {$scope['col']} = ?";
                    $params[] = $scope['val'];
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                }
            } else {
                $stmt = $pdo->prepare("INSERT INTO loyalty_programs (user_id, workspace_id, name, description, points_to_currency_ratio, signup_bonus, birthday_bonus, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $userId,
                    $workspaceId,
                    $b['name'],
                    $b['description'] ?? null,
                    $b['points_to_currency_ratio'] ?? 1.0,
                    $b['signup_bonus'] ?? 0,
                    $b['birthday_bonus'] ?? 0,
                    $b['is_active'] ?? true
                ]);
            }
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function getCustomerPoints(string $contactId): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT * FROM loyalty_points WHERE contact_id = ? AND {$scope['col']} = ?");
            $stmt->execute([$contactId, $scope['val']]);
            $points = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$points) {
                Response::json(['points_balance' => 0, 'total_points_earned' => 0]);
                return;
            }
            Response::json($points);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function getTransactions(string $contactId = null): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            if ($contactId) {
                $stmt = $pdo->prepare("SELECT * FROM loyalty_transactions WHERE contact_id = ? AND {$scope['col']} = ? ORDER BY created_at DESC");
                $stmt->execute([$contactId, $scope['val']]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM loyalty_transactions WHERE {$scope['col']} = ? ORDER BY created_at DESC LIMIT 100");
                $stmt->execute([$scope['val']]);
            }
            
            Response::json($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function adjustPoints(): void {
        Auth::userIdOrFail();
        try {
            $b = get_json_body();
            $pdo = Database::conn();
            $userId = Auth::userId();
            $workspaceId = ($GLOBALS['tenantContext'] ?? null)?->workspaceId ?? null;
            $scope = self::getWorkspaceScope();
            
            $contactId = $b['contact_id'];
            $points = (int)$b['points'];
            $type = $b['type'] ?? 'adjustment'; // earn, redeem, bonus, adjustment
            $description = $b['description'] ?? '';

            $pdo->beginTransaction();

            // Update or create loyalty_points record
            $stmt = $pdo->prepare("SELECT id, points_balance, total_points_earned FROM loyalty_points WHERE contact_id = ? AND {$scope['col']} = ?");
            $stmt->execute([$contactId, $scope['val']]);
            $lp = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($lp) {
                $newBalance = $lp['points_balance'] + $points;
                $newTotal = $lp['total_points_earned'] + ($points > 0 ? $points : 0);
                $stmt = $pdo->prepare("UPDATE loyalty_points SET points_balance = ?, total_points_earned = ?, last_transaction_at = NOW() WHERE id = ?");
                $stmt->execute([$newBalance, $newTotal, $lp['id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO loyalty_points (user_id, workspace_id, contact_id, points_balance, total_points_earned, last_transaction_at) VALUES (?, ?, ?, ?, ?, NOW())");
                $stmt->execute([
                    $userId,
                    $workspaceId,
                    $contactId,
                    $points,
                    ($points > 0 ? $points : 0)
                ]);
            }

            // Log transaction
            $stmt = $pdo->prepare("INSERT INTO loyalty_transactions (user_id, workspace_id, contact_id, type, points, description) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$userId, $workspaceId, $contactId, $type, $points, $description]);

            $pdo->commit();
            Response::json(['success' => true]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            Response::error($e->getMessage());
        }
    }

    public static function createReward(): void {
        Auth::userIdOrFail();
        try {
            $b = get_json_body();
            $pdo = Database::conn();
            $userId = Auth::userId();
            $workspaceId = ($GLOBALS['tenantContext'] ?? null)?->workspaceId ?? null;
            
            $stmt = $pdo->prepare("INSERT INTO loyalty_rewards (user_id, workspace_id, name, description, points_cost, reward_type, reward_value, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $userId,
                $workspaceId,
                $b['name'],
                $b['description'] ?? null,
                $b['points_cost'],
                $b['reward_type'],
                $b['reward_value'] ?? 0,
                $b['is_active'] ?? true
            ]);
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function updateReward(string $id): void {
        Auth::userIdOrFail();
        try {
            $b = get_json_body();
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $allowedFields = ['name', 'description', 'points_cost', 'reward_type', 'reward_value', 'is_active'];
            $updates = [];
            $params = [];
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $b)) {
                    $updates[] = "$field = ?";
                    $params[] = $b[$field];
                }
            }

            if (empty($updates)) {
                Response::json(['success' => true]);
                return;
            }

            $sql = "UPDATE loyalty_rewards SET " . implode(', ', $updates) . " WHERE id = ? AND {$scope['col']} = ?";
            $params[] = $id;
            $params[] = $scope['val'];
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function deleteReward(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("DELETE FROM loyalty_rewards WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
