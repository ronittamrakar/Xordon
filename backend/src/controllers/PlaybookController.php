<?php

namespace App\Controllers;

use App\Services\PlaybookService;

class PlaybookController
{
    private PlaybookService $playbookService;

    public function __construct()
    {
        $this->playbookService = new PlaybookService();
    }

    /**
     * GET /api/playbooks - List all playbooks
     */
    public function index(): void
    {
        try {
            $userId = $_REQUEST['user_id'] ?? null;
            $persona = $_GET['persona'] ?? null;
            
            $playbooks = $this->playbookService->getPlaybooks($userId, $persona);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'playbooks' => $playbooks
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/playbooks/:id - Get single playbook
     */
    public function show(int $id): void
    {
        try {
            $userId = $_REQUEST['user_id'] ?? null;
            $playbook = $this->playbookService->getPlaybookById($id, $userId);
            
            if (!$playbook) {
                http_response_code(404);
                echo json_encode(['error' => 'Playbook not found']);
                return;
            }
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'playbook' => $playbook
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }


    /**
     * POST /api/playbooks - Create new playbook
     */
    public function create(): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $_REQUEST['user_id'] ?? null;
            
            if (!$userId) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                return;
            }
            
            $playbook = $this->playbookService->createPlaybook([
                'name' => $data['name'] ?? '',
                'description' => $data['description'] ?? '',
                'persona' => $data['persona'] ?? 'general',
                'templates' => $data['templates'] ?? [],
                'permissions' => $data['permissions'] ?? [],
                'user_id' => $userId
            ]);
            
            header('Content-Type: application/json');
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'playbook' => $playbook
            ]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    /**
     * PUT /api/playbooks/:id - Update playbook
     */
    public function update(int $id): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $_REQUEST['user_id'] ?? null;
            
            $playbook = $this->playbookService->updatePlaybook($id, [
                'name' => $data['name'] ?? null,
                'description' => $data['description'] ?? null,
                'persona' => $data['persona'] ?? null,
                'templates' => $data['templates'] ?? null,
                'permissions' => $data['permissions'] ?? null
            ], $userId);
            
            if (!$playbook) {
                http_response_code(404);
                echo json_encode(['error' => 'Playbook not found or access denied']);
                return;
            }
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'playbook' => $playbook
            ]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    /**
     * DELETE /api/playbooks/:id - Delete playbook
     */
    public function delete(int $id): void
    {
        try {
            $userId = $_REQUEST['user_id'] ?? null;
            $result = $this->playbookService->deletePlaybook($id, $userId);
            
            if (!$result) {
                http_response_code(404);
                echo json_encode(['error' => 'Playbook not found or access denied']);
                return;
            }
            
            header('Content-Type: application/json');
            echo json_encode(['success' => true]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/playbooks/:id/versions - Get version history
     */
    public function getVersions(int $id): void
    {
        try {
            $userId = $_REQUEST['user_id'] ?? null;
            $versions = $this->playbookService->getPlaybookVersions($id, $userId);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'versions' => $versions
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
