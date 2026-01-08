<?php
namespace Xordon\Services;

use Xordon\Database;
use Xordon\Logger;
use PDO;
use DateTime;
use DateTimeZone;

/**
 * BusinessHoursService - Handles business hours and holiday checking
 */
class BusinessHoursService {
    
    /**
     * Check if currently within business hours
     */
    public static function isOpen(?int $userId = null, ?int $workspaceId = null, ?int $hoursId = null): array {
        $pdo = Database::conn();
        
        // Get business hours config
        if ($hoursId) {
            $stmt = $pdo->prepare("SELECT * FROM business_hours WHERE id = ?");
            $stmt->execute([$hoursId]);
        } else {
            // Get default hours
            $stmt = $pdo->prepare("
                SELECT * FROM business_hours 
                WHERE (user_id = ? OR workspace_id = ?) AND is_default = 1
                LIMIT 1
            ");
            $stmt->execute([$userId, $workspaceId]);
        }
        
        $hours = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$hours) {
            // No hours configured - assume always open
            return [
                'is_open' => true,
                'reason' => 'no_hours_configured',
                'message' => 'We are available to take your call.'
            ];
        }
        
        $timezone = $hours['timezone'] ?? 'America/New_York';
        
        try {
            $tz = new DateTimeZone($timezone);
            $now = new DateTime('now', $tz);
            $currentTime = $now->format('H:i:s');
            $dayOfWeek = strtolower($now->format('l')); // monday, tuesday, etc.
            
            // Check if today is a holiday
            $isHoliday = self::isHoliday($userId, $workspaceId, $now->format('Y-m-d'));
            if ($isHoliday) {
                return [
                    'is_open' => false,
                    'reason' => 'holiday',
                    'message' => 'We are closed for a holiday. Please call back on the next business day.',
                    'timezone' => $timezone,
                    'current_time' => $currentTime
                ];
            }
            
            // Get today's hours
            $openCol = $dayOfWeek . '_open';
            $closeCol = $dayOfWeek . '_close';
            
            $openTime = $hours[$openCol] ?? null;
            $closeTime = $hours[$closeCol] ?? null;
            
            if (!$openTime || !$closeTime) {
                // Closed today
                return [
                    'is_open' => false,
                    'reason' => 'closed_today',
                    'message' => 'We are closed today. Please call back during our regular business hours.',
                    'timezone' => $timezone,
                    'current_time' => $currentTime,
                    'next_open' => self::getNextOpenTime($hours, $now)
                ];
            }
            
            // Check if current time is within hours
            $isWithinHours = ($currentTime >= $openTime && $currentTime <= $closeTime);
            
            if ($isWithinHours) {
                return [
                    'is_open' => true,
                    'reason' => 'within_hours',
                    'message' => 'We are available to take your call.',
                    'timezone' => $timezone,
                    'current_time' => $currentTime,
                    'closes_at' => $closeTime
                ];
            } else {
                // Outside hours
                $beforeOpen = ($currentTime < $openTime);
                
                return [
                    'is_open' => false,
                    'reason' => $beforeOpen ? 'before_hours' : 'after_hours',
                    'message' => $beforeOpen 
                        ? "We open at $openTime. Please call back during our business hours."
                        : "We are closed for the day. Please call back tomorrow.",
                    'timezone' => $timezone,
                    'current_time' => $currentTime,
                    'opens_at' => $beforeOpen ? $openTime : null,
                    'next_open' => self::getNextOpenTime($hours, $now)
                ];
            }
            
        } catch (\Exception $e) {
            Logger::error("Business hours check failed: " . $e->getMessage());
            return [
                'is_open' => true,
                'reason' => 'error',
                'message' => 'We are available to take your call.'
            ];
        }
    }
    
    /**
     * Check if a date is a holiday
     */
    public static function isHoliday(?int $userId, ?int $workspaceId, string $date): bool {
        $pdo = Database::conn();
        
        // Format for recurring check (MM-DD)
        $monthDay = date('m-d', strtotime($date));
        
        $stmt = $pdo->prepare("
            SELECT id FROM holidays 
            WHERE (user_id = ? OR workspace_id = ?)
            AND (
                date = ?
                OR (is_recurring = 1 AND DATE_FORMAT(date, '%m-%d') = ?)
            )
        ");
        $stmt->execute([$userId, $workspaceId, $date, $monthDay]);
        
        return $stmt->fetch() !== false;
    }
    
    /**
     * Get next open time from now
     */
    private static function getNextOpenTime(array $hours, DateTime $now): ?string {
        $days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        $currentDayIndex = (int)$now->format('w'); // 0 = Sunday
        
        // Check next 7 days
        for ($i = 0; $i <= 7; $i++) {
            $checkDayIndex = ($currentDayIndex + $i) % 7;
            $dayName = $days[$checkDayIndex];
            $openCol = $dayName . '_open';
            
            if (!empty($hours[$openCol])) {
                $openTime = $hours[$openCol];
                
                if ($i === 0) {
                    // Today - check if we haven't passed open time
                    if ($now->format('H:i:s') < $openTime) {
                        return $dayName . ' at ' . date('g:i A', strtotime($openTime));
                    }
                } else {
                    // Future day
                    return ucfirst($dayName) . ' at ' . date('g:i A', strtotime($openTime));
                }
            }
        }
        
        return null;
    }
    
    /**
     * Get formatted business hours for display
     */
    public static function getFormattedHours(?int $userId, ?int $workspaceId): array {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT * FROM business_hours 
            WHERE (user_id = ? OR workspace_id = ?) AND is_default = 1
            LIMIT 1
        ");
        $stmt->execute([$userId, $workspaceId]);
        $hours = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$hours) {
            return [
                'configured' => false,
                'schedule' => []
            ];
        }
        
        $days = [
            'monday' => 'Monday',
            'tuesday' => 'Tuesday', 
            'wednesday' => 'Wednesday',
            'thursday' => 'Thursday',
            'friday' => 'Friday',
            'saturday' => 'Saturday',
            'sunday' => 'Sunday'
        ];
        
        $schedule = [];
        foreach ($days as $key => $label) {
            $open = $hours[$key . '_open'];
            $close = $hours[$key . '_close'];
            
            $schedule[] = [
                'day' => $label,
                'open' => $open ? date('g:i A', strtotime($open)) : null,
                'close' => $close ? date('g:i A', strtotime($close)) : null,
                'is_open' => !empty($open) && !empty($close)
            ];
        }
        
        return [
            'configured' => true,
            'name' => $hours['name'],
            'timezone' => $hours['timezone'],
            'schedule' => $schedule
        ];
    }
    
    /**
     * Update business hours
     */
    public static function updateHours(int $userId, ?int $workspaceId, array $data): array {
        $pdo = Database::conn();
        
        // Check if default hours exist
        $stmt = $pdo->prepare("
            SELECT id FROM business_hours 
            WHERE (user_id = ? OR workspace_id = ?) AND is_default = 1
        ");
        $stmt->execute([$userId, $workspaceId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        if ($existing) {
            // Update
            $updates = ['timezone = ?', 'name = ?', 'updated_at = NOW()'];
            $params = [$data['timezone'] ?? 'America/New_York', $data['name'] ?? 'Business Hours'];
            
            foreach ($days as $day) {
                $updates[] = "{$day}_open = ?";
                $updates[] = "{$day}_close = ?";
                $params[] = $data["{$day}_open"] ?? null;
                $params[] = $data["{$day}_close"] ?? null;
            }
            
            $params[] = $existing['id'];
            
            $stmt = $pdo->prepare("UPDATE business_hours SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);
            
            return ['success' => true, 'id' => $existing['id'], 'action' => 'updated'];
        } else {
            // Insert
            $columns = ['user_id', 'workspace_id', 'name', 'timezone', 'is_default'];
            $values = [$userId, $workspaceId, $data['name'] ?? 'Business Hours', $data['timezone'] ?? 'America/New_York', 1];
            
            foreach ($days as $day) {
                $columns[] = "{$day}_open";
                $columns[] = "{$day}_close";
                $values[] = $data["{$day}_open"] ?? null;
                $values[] = $data["{$day}_close"] ?? null;
            }
            
            $placeholders = implode(', ', array_fill(0, count($columns), '?'));
            
            $stmt = $pdo->prepare("INSERT INTO business_hours (" . implode(', ', $columns) . ") VALUES ($placeholders)");
            $stmt->execute($values);
            
            return ['success' => true, 'id' => $pdo->lastInsertId(), 'action' => 'created'];
        }
    }
    
    /**
     * Get holidays list
     */
    public static function getHolidays(?int $userId, ?int $workspaceId): array {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT * FROM holidays 
            WHERE (user_id = ? OR workspace_id = ?)
            ORDER BY date ASC
        ");
        $stmt->execute([$userId, $workspaceId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Add a holiday
     */
    public static function addHoliday(int $userId, ?int $workspaceId, string $name, string $date, bool $isRecurring = false): int {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            INSERT INTO holidays (user_id, workspace_id, name, date, is_recurring, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $workspaceId, $name, $date, $isRecurring ? 1 : 0]);
        
        return (int)$pdo->lastInsertId();
    }
    
    /**
     * Remove a holiday
     */
    public static function removeHoliday(int $holidayId, ?int $userId, ?int $workspaceId): bool {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("DELETE FROM holidays WHERE id = ? AND (user_id = ? OR workspace_id = ?)");
        $stmt->execute([$holidayId, $userId, $workspaceId]);
        
        return $stmt->rowCount() > 0;
    }
}
