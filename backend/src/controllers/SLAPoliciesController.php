<?php

namespace App\Controllers;

use PDO;

class SLAPoliciesController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * List all SLA policies
     */
    public function list($req, $res)
    {
        try {
            $workspaceId = $req->getAttribute('workspace_id');

            $stmt = $this->db->prepare("
                SELECT * FROM sla_policies
                WHERE workspace_id = :workspace_id
                ORDER BY is_active DESC, name ASC
            ");
            $stmt->execute(['workspace_id' => $workspaceId]);
            $policies = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $res->json($policies);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }

    /**
     * Get a single SLA policy
     */
    public function get($req, $res)
    {
        try {
            $workspaceId = $req->getAttribute('workspace_id');
            $id = $req->params['id'];

            $stmt = $this->db->prepare("
                SELECT * FROM sla_policies
                WHERE id = :id AND workspace_id = :workspace_id
            ");
            $stmt->execute(['id' => $id, 'workspace_id' => $workspaceId]);
            $policy = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$policy) {
                return $res->status(404)->json(['error' => 'Policy not found']);
            }

            return $res->json($policy);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }

    /**
     * Create a new SLA policy
     */
    public function create($req, $res)
    {
        try {
            $workspaceId = $req->getAttribute('workspace_id');
            $data = $req->body;

            $stmt = $this->db->prepare("
                INSERT INTO sla_policies (
                    workspace_id, name, description, is_active,
                    priority_urgent_response_minutes, priority_urgent_resolution_minutes,
                    priority_high_response_minutes, priority_high_resolution_minutes,
                    priority_normal_response_minutes, priority_normal_resolution_minutes,
                    priority_low_response_minutes, priority_low_resolution_minutes,
                    business_hours_only, business_hours_start, business_hours_end, business_days
                ) VALUES (
                    :workspace_id, :name, :description, :is_active,
                    :priority_urgent_response_minutes, :priority_urgent_resolution_minutes,
                    :priority_high_response_minutes, :priority_high_resolution_minutes,
                    :priority_normal_response_minutes, :priority_normal_resolution_minutes,
                    :priority_low_response_minutes, :priority_low_resolution_minutes,
                    :business_hours_only, :business_hours_start, :business_hours_end, :business_days
                )
            ");

            $stmt->execute([
                'workspace_id' => $workspaceId,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'priority_urgent_response_minutes' => $data['priority_urgent_response_minutes'] ?? null,
                'priority_urgent_resolution_minutes' => $data['priority_urgent_resolution_minutes'] ?? null,
                'priority_high_response_minutes' => $data['priority_high_response_minutes'] ?? null,
                'priority_high_resolution_minutes' => $data['priority_high_resolution_minutes'] ?? null,
                'priority_normal_response_minutes' => $data['priority_normal_response_minutes'] ?? null,
                'priority_normal_resolution_minutes' => $data['priority_normal_resolution_minutes'] ?? null,
                'priority_low_response_minutes' => $data['priority_low_response_minutes'] ?? null,
                'priority_low_resolution_minutes' => $data['priority_low_resolution_minutes'] ?? null,
                'business_hours_only' => $data['business_hours_only'] ?? false,
                'business_hours_start' => $data['business_hours_start'] ?? null,
                'business_hours_end' => $data['business_hours_end'] ?? null,
                'business_days' => $data['business_days'] ?? null,
            ]);

            $id = $this->db->lastInsertId();

            return $res->status(201)->json(['id' => $id, 'message' => 'Policy created']);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }

    /**
     * Update an SLA policy
     */
    public function update($req, $res)
    {
        try {
            $workspaceId = $req->getAttribute('workspace_id');
            $id = $req->params['id'];
            $data = $req->body;

            $stmt = $this->db->prepare("
                UPDATE sla_policies SET
                    name = :name,
                    description = :description,
                    is_active = :is_active,
                    priority_urgent_response_minutes = :priority_urgent_response_minutes,
                    priority_urgent_resolution_minutes = :priority_urgent_resolution_minutes,
                    priority_high_response_minutes = :priority_high_response_minutes,
                    priority_high_resolution_minutes = :priority_high_resolution_minutes,
                    priority_normal_response_minutes = :priority_normal_response_minutes,
                    priority_normal_resolution_minutes = :priority_normal_resolution_minutes,
                    priority_low_response_minutes = :priority_low_response_minutes,
                    priority_low_resolution_minutes = :priority_low_resolution_minutes,
                    business_hours_only = :business_hours_only,
                    business_hours_start = :business_hours_start,
                    business_hours_end = :business_hours_end,
                    business_days = :business_days,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id AND workspace_id = :workspace_id
            ");

            $stmt->execute([
                'id' => $id,
                'workspace_id' => $workspaceId,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'priority_urgent_response_minutes' => $data['priority_urgent_response_minutes'] ?? null,
                'priority_urgent_resolution_minutes' => $data['priority_urgent_resolution_minutes'] ?? null,
                'priority_high_response_minutes' => $data['priority_high_response_minutes'] ?? null,
                'priority_high_resolution_minutes' => $data['priority_high_resolution_minutes'] ?? null,
                'priority_normal_response_minutes' => $data['priority_normal_response_minutes'] ?? null,
                'priority_normal_resolution_minutes' => $data['priority_normal_resolution_minutes'] ?? null,
                'priority_low_response_minutes' => $data['priority_low_response_minutes'] ?? null,
                'priority_low_resolution_minutes' => $data['priority_low_resolution_minutes'] ?? null,
                'business_hours_only' => $data['business_hours_only'] ?? false,
                'business_hours_start' => $data['business_hours_start'] ?? null,
                'business_hours_end' => $data['business_hours_end'] ?? null,
                'business_days' => $data['business_days'] ?? null,
            ]);

            return $res->json(['message' => 'Policy updated']);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete an SLA policy
     */
    public function delete($req, $res)
    {
        try {
            $workspaceId = $req->getAttribute('workspace_id');
            $id = $req->params['id'];

            $stmt = $this->db->prepare("
                DELETE FROM sla_policies
                WHERE id = :id AND workspace_id = :workspace_id
            ");
            $stmt->execute(['id' => $id, 'workspace_id' => $workspaceId]);

            return $res->json(['message' => 'Policy deleted']);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }
}
