<?php
/**
 * SchedulingAnalyticsController - Analytics for appointments and booking pages
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class SchedulingAnalyticsController {
    
    /**
     * Get appointment analytics dashboard
     */
    public static function getDashboard(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        
        // Get overall stats
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_appointments,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_shows,
                SUM(CASE WHEN price > 0 THEN price ELSE 0 END) as total_revenue,
                AVG(CASE WHEN price > 0 THEN price ELSE NULL END) as avg_booking_value
            FROM appointments a
            LEFT JOIN booking_types bt ON bt.id = a.booking_type_id
            WHERE a.user_id = ?
            AND DATE(a.scheduled_at) BETWEEN ? AND ?
        ");
        $stmt->execute([$userId, $startDate, $endDate]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Calculate rates
        $total = $stats['total_appointments'] ?: 1;
        $stats['completion_rate'] = round(($stats['completed'] / $total) * 100, 1);
        $stats['no_show_rate'] = round(($stats['no_shows'] / $total) * 100, 1);
        $stats['cancellation_rate'] = round(($stats['cancelled'] / $total) * 100, 1);
        
        // Get daily trend
        $stmt = $pdo->prepare("
            SELECT 
                DATE(scheduled_at) as date,
                COUNT(*) as bookings,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN price > 0 THEN price ELSE 0 END) as revenue
            FROM appointments a
            LEFT JOIN booking_types bt ON bt.id = a.booking_type_id
            WHERE a.user_id = ?
            AND DATE(a.scheduled_at) BETWEEN ? AND ?
            GROUP BY DATE(scheduled_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$userId, $startDate, $endDate]);
        $dailyTrend = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get top services
        $stmt = $pdo->prepare("
            SELECT 
                bt.name,
                bt.id,
                COUNT(*) as bookings,
                SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN bt.price > 0 THEN bt.price ELSE 0 END) as revenue
            FROM appointments a
            JOIN booking_types bt ON bt.id = a.booking_type_id
            WHERE a.user_id = ?
            AND DATE(a.scheduled_at) BETWEEN ? AND ?
            GROUP BY bt.id
            ORDER BY bookings DESC
            LIMIT 10
        ");
        $stmt->execute([$userId, $startDate, $endDate]);
        $topServices = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get upcoming revenue forecast
        $stmt = $pdo->prepare("
            SELECT 
                SUM(CASE WHEN bt.price > 0 THEN bt.price ELSE 0 END) as forecasted_revenue,
                COUNT(*) as upcoming_appointments
            FROM appointments a
            JOIN booking_types bt ON bt.id = a.booking_type_id
            WHERE a.user_id = ?
            AND a.scheduled_at >= NOW()
            AND a.status IN ('scheduled', 'confirmed')
        ");
        $stmt->execute([$userId]);
        $forecast = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json([
            'stats' => $stats,
            'daily_trend' => $dailyTrend,
            'top_services' => $topServices,
            'forecast' => $forecast,
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ]);
    }
    
    /**
     * Get booking page funnel analytics
     */
    public static function getBookingPageFunnel(string $pageId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Verify ownership
        $stmt = $pdo->prepare("SELECT id FROM booking_pages WHERE id = ? AND user_id = ?");
        $stmt->execute([$pageId, $userId]);
        if (!$stmt->fetch()) {
            Response::notFound('Booking page not found');
            return;
        }
        
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        
        // Get funnel steps
        $steps = [
            'page_view' => 'Page Views',
            'service_selected' => 'Service Selected',
            'time_selected' => 'Time Selected',
            'form_started' => 'Form Started',
            'form_completed' => 'Form Completed',
            'booking_confirmed' => 'Booking Confirmed'
        ];
        
        $funnelData = [];
        $previousCount = null;
        
        foreach ($steps as $step => $label) {
            $stmt = $pdo->prepare("
                SELECT COUNT(DISTINCT session_id) as count
                FROM booking_page_analytics
                WHERE booking_page_id = ?
                AND step = ?
                AND DATE(created_at) BETWEEN ? AND ?
            ");
            $stmt->execute([$pageId, $step, $startDate, $endDate]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $count = $result['count'];
            
            $dropoff = 0;
            $conversionRate = 0;
            
            if ($previousCount !== null && $previousCount > 0) {
                $dropoff = $previousCount - $count;
                $conversionRate = round(($count / $previousCount) * 100, 1);
            }
            
            $funnelData[] = [
                'step' => $step,
                'label' => $label,
                'count' => $count,
                'dropoff' => $dropoff,
                'conversion_rate' => $conversionRate
            ];
            
            $previousCount = $count;
        }
        
        // Calculate overall conversion rate
        $pageViews = $funnelData[0]['count'] ?? 1;
        $bookings = $funnelData[count($funnelData) - 1]['count'] ?? 0;
        $overallConversion = round(($bookings / $pageViews) * 100, 1);
        
        Response::json([
            'funnel' => $funnelData,
            'overall_conversion_rate' => $overallConversion,
            'total_page_views' => $pageViews,
            'total_bookings' => $bookings,
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ]);
    }
    
    /**
     * Track booking page view
     */
    public static function trackPageView(): void {
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['booking_page_id']) || empty($body['session_id'])) {
            Response::validationError('booking_page_id and session_id are required');
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO booking_page_analytics 
            (booking_page_id, session_id, step, ip_address, user_agent, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $body['booking_page_id'],
            $body['session_id'],
            $body['step'] ?? 'page_view',
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            isset($body['metadata']) ? json_encode($body['metadata']) : null
        ]);
        
        Response::json(['success' => true]);
    }
    
    /**
     * Get video provider statistics
     */
    public static function getVideoProviderStats(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT 
                a.video_provider,
                COUNT(*) as total_meetings,
                COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_meetings,
                COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as no_shows
            FROM appointments a
            WHERE a.user_id = ?
            AND a.video_provider != 'none'
            AND a.video_meeting_url IS NOT NULL
            GROUP BY a.video_provider
        ");
        $stmt->execute([$userId]);
        $providerStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate reliability scores
        foreach ($providerStats as &$stat) {
            $total = $stat['total_meetings'] ?: 1;
            $stat['completion_rate'] = round(($stat['completed_meetings'] / $total) * 100, 1);
            $stat['reliability_score'] = max(0, 100 - (($stat['no_shows'] / $total) * 100));
        }
        
        Response::json(['provider_stats' => $providerStats]);
    }
    
    /**
     * Get staff performance analytics
     */
    public static function getStaffPerformance(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            SELECT 
                s.id,
                s.name,
                COUNT(a.id) as total_appointments,
                SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) as no_shows,
                SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN bt.price > 0 THEN bt.price ELSE 0 END) as revenue
            FROM staff s
            LEFT JOIN appointments a ON a.staff_id = s.id
            LEFT JOIN booking_types bt ON bt.id = a.booking_type_id
            WHERE s.user_id = ?
            AND DATE(a.scheduled_at) BETWEEN ? AND ?
            GROUP BY s.id
            ORDER BY total_appointments DESC
        ");
        $stmt->execute([$userId, $startDate, $endDate]);
        $staffPerformance = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate rates
        foreach ($staffPerformance as &$staff) {
            $total = $staff['total_appointments'] ?: 1;
            $staff['completion_rate'] = round(($staff['completed'] / $total) * 100, 1);
            $staff['no_show_rate'] = round(($staff['no_shows'] / $total) * 100, 1);
        }
        
        Response::json(['staff_performance' => $staffPerformance]);
    }
    
    /**
     * Export analytics data
     */
    public static function exportAnalytics(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            SELECT 
                a.id,
                a.scheduled_at,
                a.status,
                bt.name as service,
                c.name as contact_name,
                c.email as contact_email,
                s.name as staff_name,
                bt.price as amount,
                a.video_provider,
                a.confirmation_sent_at,
                a.created_at
            FROM appointments a
            LEFT JOIN booking_types bt ON bt.id = a.booking_type_id
            LEFT JOIN contacts c ON c.id = a.contact_id
            LEFT JOIN staff s ON s.id = a.staff_id
            WHERE a.user_id = ?
            AND DATE(a.scheduled_at) BETWEEN ? AND ?
            ORDER BY a.scheduled_at DESC
        ");
        $stmt->execute([$userId, $startDate, $endDate]);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Generate CSV
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="appointments_export_' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        
        // Headers
        fputcsv($output, [
            'ID', 'Date', 'Time', 'Status', 'Service', 'Contact', 'Email', 
            'Staff', 'Amount', 'Video Provider', 'Confirmed At', 'Created At'
        ]);
        
        // Data
        foreach ($appointments as $apt) {
            fputcsv($output, [
                $apt['id'],
                date('Y-m-d', strtotime($apt['scheduled_at'])),
                date('H:i', strtotime($apt['scheduled_at'])),
                $apt['status'],
                $apt['service'],
                $apt['contact_name'],
                $apt['contact_email'],
                $apt['staff_name'],
                $apt['amount'],
                $apt['video_provider'],
                $apt['confirmation_sent_at'],
                $apt['created_at']
            ]);
        }
        
        fclose($output);
        exit;
    }
}
