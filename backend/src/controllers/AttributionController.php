<?php

namespace App\Controllers;

use App\Services\AttributionService;

class AttributionController
{
    private AttributionService $attributionService;

    public function __construct()
    {
        $this->attributionService = new AttributionService();
    }

    /**
     * GET /api/attribution/report - Get attribution report
     */
    public function getReport(): void
    {
        try {
            $userId = $_REQUEST['user_id'] ?? null;
            $model = $_GET['model'] ?? 'first_touch';
            $startDate = $_GET['start_date'] ?? null;
            $endDate = $_GET['end_date'] ?? null;
            $groupBy = $_GET['group_by'] ?? 'source';
            
            $report = $this->attributionService->calculateAttribution([
                'user_id' => $userId,
                'model' => $model,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'group_by' => $groupBy
            ]);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'report' => $report
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/contacts/:id/journey - Get lead journey
     */
    public function getJourney(int $contactId): void
    {
        try {
            $userId = $_REQUEST['user_id'] ?? null;
            $journey = $this->attributionService->getLeadJourney($contactId, $userId);
            
            if (!$journey) {
                http_response_code(404);
                echo json_encode(['error' => 'Contact not found']);
                return;
            }
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'journey' => $journey
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/contacts/:id/touchpoint - Add touchpoint
     */
    public function addTouchpoint(int $contactId): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $_REQUEST['user_id'] ?? null;
            
            $touchpoint = $this->attributionService->addTouchpoint($contactId, [
                'user_id' => $userId,
                'channel' => $data['channel'] ?? '',
                'source' => $data['source'] ?? '',
                'campaign' => $data['campaign'] ?? null,
                'content' => $data['content'] ?? null,
                'metadata' => $data['metadata'] ?? []
            ]);
            
            header('Content-Type: application/json');
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'touchpoint' => $touchpoint
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/attribution/sources - Get all lead sources
     */
    public function getSources(): void
    {
        try {
            $userId = $_REQUEST['user_id'] ?? null;
            $sources = $this->attributionService->getLeadSources($userId);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'sources' => $sources
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/attribution/models - Get available attribution models
     */
    public function getModels(): void
    {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'models' => [
                ['id' => 'first_touch', 'name' => 'First Touch', 'description' => '100% credit to first interaction'],
                ['id' => 'last_touch', 'name' => 'Last Touch', 'description' => '100% credit to last interaction'],
                ['id' => 'linear', 'name' => 'Linear', 'description' => 'Equal credit to all touchpoints'],
                ['id' => 'time_decay', 'name' => 'Time Decay', 'description' => 'More credit to recent touchpoints'],
                ['id' => 'position_based', 'name' => 'Position Based', 'description' => '40% first, 40% last, 20% middle']
            ]
        ]);
    }
}
