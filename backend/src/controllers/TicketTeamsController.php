<?php

namespace App\Controllers;

use PDO;

class TicketTeamsController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * List all teams
     */
    public function list($req, $res)
    {
        try {
            $workspaceId = $req->getAttribute('workspace_id');

            $stmt = $this->db->prepare("
                SELECT t.*,
                    (SELECT COUNT(*) FROM ticket_team_members WHERE team_id = t.id AND is_active = 1) as member_count
                FROM ticket_teams t
                WHERE t.workspace_id = :workspace_id
                ORDER BY t.is_active DESC, t.name ASC
            ");
            $stmt->execute(['workspace_id' => $workspaceId]);
            $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $res->json($teams);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }

    /**
     * Get a single team
     */
    public function get($req, $res)
    {
        try {
            $workspaceId = $req->getAttribute('workspace_id');
            $id = $req->params['id'];

            $stmt = $this->db->prepare("
                SELECT * FROM ticket_teams
                WHERE id = :id AND workspace_id = :workspace_id
            ");
            $stmt->execute(['id' => $id, 'workspace_id' => $workspaceId]);
            $team = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$team) {
                return $res->status(404)->json(['error' => 'Team not found']);
            }

            return $res->json($team);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }

    /**
     * Create a new team
     */
    public function create($req, $res)
    {
        try {
            $workspaceId = $req->getAttribute('workspace_id');
            $data = $req->body;

            $stmt = $this->db->prepare("
                INSERT INTO ticket_teams (
                    workspace_id, name, description, is_active,
                    auto_assign_enabled, auto_assign_strategy
                ) VALUES (
                    :workspace_id, :name, :description, :is_active,
                    :auto_assign_enabled, :auto_assign_strategy
                )
            ");

            $stmt->execute([
                'workspace_id' => $workspaceId,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'auto_assign_enabled' => $data['auto_assign_enabled'] ?? false,
                'auto_assign_strategy' => $data['auto_assign_strategy'] ?? null,
            ]);

            $id = $this->db->lastInsertId();

            return $res->status(201)->json(['id' => $id, 'message' => 'Team created']);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }

    /**
     * Update a team
     */
    public function update($req, $res)
    {
        try {
            $workspaceId = $req->getAttribute('workspace_id');
            $id = $req->params['id'];
            $data = $req->body;

            $stmt = $this->db->prepare("
                UPDATE ticket_teams SET
                    name = :name,
                    description = :description,
                    is_active = :is_active,
                    auto_assign_enabled = :auto_assign_enabled,
                    auto_assign_strategy = :auto_assign_strategy,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id AND workspace_id = :workspace_id
            ");

            $stmt->execute([
                'id' => $id,
                'workspace_id' => $workspaceId,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'auto_assign_enabled' => $data['auto_assign_enabled'] ?? false,
                'auto_assign_strategy' => $data['auto_assign_strategy'] ?? null,
            ]);

            return $res->json(['message' => 'Team updated']);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete a team
     */
    public function delete($req, $res)
    {
        try {
            $workspaceId = $req->getAttribute('workspace_id');
            $id = $req->params['id'];

            // Delete team members first
            $stmt = $this->db->prepare("DELETE FROM ticket_team_members WHERE team_id = :id");
            $stmt->execute(['id' => $id]);

            // Delete team
            $stmt = $this->db->prepare("
                DELETE FROM ticket_teams
                WHERE id = :id AND workspace_id = :workspace_id
            ");
            $stmt->execute(['id' => $id, 'workspace_id' => $workspaceId]);

            return $res->json(['message' => 'Team deleted']);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }

    /**
     * List team members
     */
    public function listMembers($req, $res)
    {
        try {
            $teamId = $req->params['id'];

            $stmt = $this->db->prepare("
                SELECT tm.*, u.name as user_name, u.email as user_email
                FROM ticket_team_members tm
                LEFT JOIN users u ON tm.user_id = u.id
                WHERE tm.team_id = :team_id
                ORDER BY u.name ASC
            ");
            $stmt->execute(['team_id' => $teamId]);
            $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $res->json($members);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }

    /**
     * Add a team member
     */
    public function addMember($req, $res)
    {
        try {
            $teamId = $req->params['id'];
            $data = $req->body;

            $stmt = $this->db->prepare("
                INSERT INTO ticket_team_members (team_id, user_id, role, is_active)
                VALUES (:team_id, :user_id, :role, 1)
            ");

            $stmt->execute([
                'team_id' => $teamId,
                'user_id' => $data['user_id'],
                'role' => $data['role'] ?? 'agent',
            ]);

            $id = $this->db->lastInsertId();

            return $res->status(201)->json(['id' => $id, 'message' => 'Member added']);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }

    /**
     * Remove a team member
     */
    public function removeMember($req, $res)
    {
        try {
            $teamId = $req->params['id'];
            $memberId = $req->params['memberId'];

            $stmt = $this->db->prepare("
                DELETE FROM ticket_team_members
                WHERE id = :member_id AND team_id = :team_id
            ");
            $stmt->execute(['member_id' => $memberId, 'team_id' => $teamId]);

            return $res->json(['message' => 'Member removed']);
        } catch (\Exception $e) {
            return $res->status(500)->json(['error' => $e->getMessage()]);
        }
    }
}
