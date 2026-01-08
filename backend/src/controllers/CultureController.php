<?php
namespace Xordon\Controllers;

use Xordon\Database;
use Exception;

/**
 * Culture Controller
 * Manages company culture features: surveys, recognition, events, champions
 */
class CultureController {
    
    private function getWorkspaceId() {
        return $GLOBALS['tenantContext']->workspaceId ?? $_SESSION['workspace_id'] ?? null;
    }

    /**
     * Get all surveys for a workspace
     */
    public function getSurveys() {
        $workspaceId = $this->getWorkspaceId();
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT * FROM culture_surveys WHERE workspace_id = ? ORDER BY created_at DESC";
        $surveys = Database::select($sql, [$workspaceId]);
        
        foreach ($surveys as &$survey) {
            $survey['questions'] = json_decode($survey['questions'] ?? '[]', true);
            $survey['target_audience'] = json_decode($survey['target_audience'] ?? '{}', true);
        }
        
        return ['surveys' => $surveys];
    }
    
    /**
     * Create a new survey
     */
    public function createSurvey() {
        $workspaceId = $this->getWorkspaceId();
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO culture_surveys (
            workspace_id, title, description, questions, frequency,
            is_anonymous, status, target_audience, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $workspaceId,
                $data['title'],
                $data['description'] ?? null,
                json_encode($data['questions'] ?? []),
                $data['frequency'] ?? 'one_time',
                $data['is_anonymous'] ?? true,
                $data['status'] ?? 'draft',
                json_encode($data['target_audience'] ?? []),
                $_SESSION['user_id'] ?? null
            ]);
            
            $id = Database::conn()->lastInsertId();
            return ['success' => true, 'id' => $id];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Submit survey response
     */
    public function submitSurveyResponse($surveyId) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO culture_survey_responses (
            survey_id, employee_id, responses, sentiment_score, completion_time_seconds
        ) VALUES (?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $surveyId,
                $data['employee_id'] ?? null,
                json_encode($data['responses'] ?? []),
                $data['sentiment_score'] ?? null,
                $data['completion_time_seconds'] ?? null
            ]);
            
            // Update survey response count
            Database::execute(
                "UPDATE culture_surveys SET response_count = response_count + 1 WHERE id = ?",
                [$surveyId]
            );
            
            return ['success' => true];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get peer recognitions
     */
    public function getRecognitions() {
        $workspaceId = $this->getWorkspaceId();
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT r.*, 
                from_emp.name as from_employee_name,
                to_emp.name as to_employee_name
                FROM peer_recognition r
                LEFT JOIN staff_members from_emp ON r.from_employee_id = from_emp.id
                LEFT JOIN staff_members to_emp ON r.to_employee_id = to_emp.id
                WHERE r.workspace_id = ?
                ORDER BY r.created_at DESC
                LIMIT 100";
        
        $recognitions = Database::select($sql, [$workspaceId]);
        
        return $recognitions;
    }
    
    /**
     * Create peer recognition
     */
    public function createRecognition() {
        $workspaceId = $this->getWorkspaceId();
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO peer_recognition (
            workspace_id, from_employee_id, to_employee_id,
            recognition_type, message, points_awarded, is_public
        ) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $workspaceId,
                $data['from_employee_id'],
                $data['to_employee_id'],
                $data['recognition_type'] ?? null,
                $data['message'],
                $data['points_awarded'] ?? 0,
                $data['is_public'] ?? true
            ]);
            
            $id = Database::conn()->lastInsertId();
            return ['success' => true, 'id' => $id];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Add reaction to recognition
     */
    public function addReaction($recognitionId) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO recognition_reactions (
            recognition_id, employee_id, reaction_type
        ) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE reaction_type = VALUES(reaction_type)";
        
        try {
            Database::execute($sql, [
                $recognitionId,
                $data['employee_id'],
                $data['reaction_type'] ?? 'like'
            ]);
            
            // Update likes count
            Database::execute(
                "UPDATE peer_recognition SET likes_count = (
                    SELECT COUNT(*) FROM recognition_reactions WHERE recognition_id = ?
                ) WHERE id = ?",
                [$recognitionId, $recognitionId]
            );
            
            return ['success' => true];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get team events
     */
    public function getEvents() {
        $workspaceId = $this->getWorkspaceId();
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT * FROM team_events 
                WHERE workspace_id = ? 
                ORDER BY event_date DESC";
        
        $events = Database::select($sql, [$workspaceId]);
        
        // Get attendee counts
        foreach ($events as &$event) {
            $attendees = Database::first(
                "SELECT COUNT(*) as count FROM event_attendees WHERE event_id = ? AND rsvp_status = 'going'",
                [$event['id']]
            );
            $event['current_attendees'] = $attendees['count'] ?? 0;
        }
        
        return $events;
    }
    
    /**
     * Create team event
     */
    public function createEvent() {
        $workspaceId = $this->getWorkspaceId();
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO team_events (
            workspace_id, title, description, event_type, event_date,
            end_date, location, location_type, virtual_link, max_attendees,
            rsvp_deadline, budget, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $workspaceId,
                $data['title'],
                $data['description'] ?? null,
                $data['event_type'] ?? null,
                $data['event_date'],
                $data['end_date'] ?? null,
                $data['location'] ?? null,
                $data['location_type'] ?? 'in_person',
                $data['virtual_link'] ?? null,
                $data['max_attendees'] ?? null,
                $data['rsvp_deadline'] ?? null,
                $data['budget'] ?? null,
                $data['status'] ?? 'draft',
                $_SESSION['user_id'] ?? null
            ]);
            
            $id = Database::conn()->lastInsertId();
            return ['success' => true, 'id' => $id];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * RSVP to event
     */
    public function rsvpEvent($eventId) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO event_attendees (
            event_id, employee_id, rsvp_status, plus_ones, dietary_restrictions, notes
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            rsvp_status = VALUES(rsvp_status),
            plus_ones = VALUES(plus_ones),
            dietary_restrictions = VALUES(dietary_restrictions),
            notes = VALUES(notes)";
        
        try {
            Database::execute($sql, [
                $eventId,
                $data['employee_id'],
                $data['rsvp_status'] ?? 'going',
                $data['plus_ones'] ?? 0,
                $data['dietary_restrictions'] ?? null,
                $data['notes'] ?? null
            ]);
            
            return ['success' => true];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get culture champions
     */
    public function getChampions() {
        $workspaceId = $this->getWorkspaceId();
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT c.*, e.name as employee_name, e.email
                FROM culture_champions c
                LEFT JOIN staff_members e ON c.employee_id = e.id
                WHERE c.workspace_id = ?
                ORDER BY c.appointed_at DESC";
        
        $champions = Database::select($sql, [$workspaceId]);
        
        foreach ($champions as &$champion) {
            $champion['achievements'] = json_decode($champion['achievements'] ?? '[]', true);
        }
        
        return $champions;
    }
    
    /**
     * Appoint culture champion
     */
    public function appointChampion() {
        $workspaceId = $this->getWorkspaceId();
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO culture_champions (
            workspace_id, employee_id, department, appointed_at, status
        ) VALUES (?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $workspaceId,
                $data['employee_id'],
                $data['department'] ?? null,
                $data['appointed_at'] ?? date('Y-m-d'),
                'active'
            ]);
            
            $id = Database::conn()->lastInsertId();
            return ['success' => true, 'id' => $id];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get culture metrics
     */
    public function getMetrics() {
        $workspaceId = $this->getWorkspaceId();
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        // Get latest metrics
        $sql = "SELECT * FROM culture_metrics 
                WHERE workspace_id = ? 
                ORDER BY date DESC 
                LIMIT 30";
        
        $metrics = Database::select($sql, [$workspaceId]);
        
        // Map to frontend naming
        foreach ($metrics as &$metric) {
            $metric['engagement'] = (float)($metric['engagement_score'] ?? 0);
            $metric['satisfaction'] = (float)($metric['satisfaction_score'] ?? 0);
            $metric['alignment'] = (float)($metric['alignment_score'] ?? 0);
            $metric['month'] = date('M', strtotime($metric['date']));
        }
        
        // Calculate current stats
        $stats = [
            'total_recognitions' => Database::first(
                "SELECT COUNT(*) as count FROM peer_recognition WHERE workspace_id = ?",
                [$workspaceId]
            )['count'] ?? 0,
            'active_surveys' => Database::first(
                "SELECT COUNT(*) as count FROM culture_surveys WHERE workspace_id = ? AND status = 'active'",
                [$workspaceId]
            )['count'] ?? 0,
            'upcoming_events' => Database::first(
                "SELECT COUNT(*) as count FROM team_events WHERE workspace_id = ? AND event_date > NOW()",
                [$workspaceId]
            )['count'] ?? 0,
            'active_champions' => Database::first(
                "SELECT COUNT(*) as count FROM culture_champions WHERE workspace_id = ? AND status = 'active'",
                [$workspaceId]
            )['count'] ?? 0
        ];
        
        return [
            'metrics' => $metrics,
            'stats' => $stats
        ];
    }

    /**
     * Get Survey Trends (Helper for frontend AreaChart)
     */
    public function getSurveyTrends() {
        $m = $this->getMetrics();
        return $m['metrics'];
    }
}
