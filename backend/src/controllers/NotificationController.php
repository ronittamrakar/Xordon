<?php

namespace App\Controllers;

use App\Services\NotificationService;

class NotificationController
{
    private NotificationService $notificationService;

    public function __construct()
    {
        $this->notificationService = new NotificationService();
    }

    /**
     * POST /api/notifications/configure - Setup Slack/Teams integration
     */
    public function configure(): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $_REQUEST['user_id'] ?? null;
            
            if (!$userId) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }
            
            $config = $this->notificationService->configureIntegration([
                'user_id' => $userId,
                'provider' => $data['provider'] ?? 'slack',
                'webhook_url' => $data['webhook_url'] ?? '',
                'channel' => $data['channel'] ?? '',
                'triggers' => $data['triggers'] ?? []
            ]);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'config' => $config
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/notifications/send - Send notification
     */
    public function send(): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $_REQUEST['user_id'] ?? null;
            
            $result = $this->notificationService->sendNotification([
                'user_id' => $userId,
                'type' => $data['type'] ?? 'info',
                'title' => $data['title'] ?? '',
                'message' => $data['message'] ?? '',
                'actions' => $data['actions'] ?? [],
                'metadata' => $data['metadata'] ?? []
            ]);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'notification_id' => $result['id'],
                'status' => $result['status']
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }


    /**
     * POST /api/notifications/action - Handle action callback
     */
    public function handleAction(): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $result = $this->notificationService->handleAction([
                'notification_id' => $data['notification_id'] ?? null,
                'action_id' => $data['action_id'] ?? '',
                'user_response' => $data['user_response'] ?? null
            ]);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'result' => $result
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/notifications/status/:id - Get delivery status
     */
    public function getStatus(int $id): void
    {
        try {
            $userId = $_REQUEST['user_id'] ?? null;
            $status = $this->notificationService->getDeliveryStatus($id, $userId);
            
            if (!$status) {
                http_response_code(404);
                echo json_encode(['error' => 'Notification not found']);
                return;
            }
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'status' => $status
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/notifications/config - Get user's notification config
     */
    public function getConfig(): void
    {
        try {
            $userId = $_REQUEST['user_id'] ?? null;
            
            if (!$userId) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }
            
            $config = $this->notificationService->getUserConfig($userId);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'config' => $config
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
