<?php

class CustomVariablesController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAll() {
        try {
            $stmt = $this->pdo->prepare('SELECT * FROM custom_variables ORDER BY name ASC');
            $stmt->execute();
            $variables = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::json(['success' => true, 'data' => $variables]);
        } catch (Exception $e) {
            Logger::error('Failed to fetch custom variables: ' . $e->getMessage());
            Response::json(['success' => false, 'error' => 'Failed to fetch custom variables'], 500);
        }
    }

    public function create() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['name']) || empty(trim($input['name']))) {
                Response::json(['success' => false, 'error' => 'Variable name is required'], 400);
                return;
            }

            $name = trim($input['name']);
            $description = isset($input['description']) ? trim($input['description']) : '';

            // Validate name format (alphanumeric and underscores only)
            if (!preg_match('/^[a-zA-Z0-9_]+$/', $name)) {
                Response::json(['success' => false, 'error' => 'Variable name can only contain letters, numbers, and underscores'], 400);
                return;
            }

            // Check if variable already exists
            $stmt = $this->pdo->prepare('SELECT id FROM custom_variables WHERE name = ?');
            $stmt->execute([$name]);
            if ($stmt->fetch()) {
                Response::json(['success' => false, 'error' => 'A variable with this name already exists'], 400);
                return;
            }

            // Insert new variable
            $stmt = $this->pdo->prepare('INSERT INTO custom_variables (name, description) VALUES (?, ?)');
            $stmt->execute([$name, $description]);
            
            $id = $this->pdo->lastInsertId();
            
            // Return the created variable
            $stmt = $this->pdo->prepare('SELECT * FROM custom_variables WHERE id = ?');
            $stmt->execute([$id]);
            $variable = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::json(['success' => true, 'data' => $variable]);
        } catch (Exception $e) {
            Logger::error('Failed to create custom variable: ' . $e->getMessage());
            Response::json(['success' => false, 'error' => 'Failed to create custom variable'], 500);
        }
    }

    public function update($id) {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['name']) || empty(trim($input['name']))) {
                Response::json(['success' => false, 'error' => 'Variable name is required'], 400);
                return;
            }

            $name = trim($input['name']);
            $description = isset($input['description']) ? trim($input['description']) : '';

            // Validate name format
            if (!preg_match('/^[a-zA-Z0-9_]+$/', $name)) {
                Response::json(['success' => false, 'error' => 'Variable name can only contain letters, numbers, and underscores'], 400);
                return;
            }

            // Check if variable exists
            $stmt = $this->pdo->prepare('SELECT id FROM custom_variables WHERE id = ?');
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                Response::json(['success' => false, 'error' => 'Variable not found'], 404);
                return;
            }

            // Check if another variable with the same name exists
            $stmt = $this->pdo->prepare('SELECT id FROM custom_variables WHERE name = ? AND id != ?');
            $stmt->execute([$name, $id]);
            if ($stmt->fetch()) {
                Response::json(['success' => false, 'error' => 'A variable with this name already exists'], 400);
                return;
            }

            // Update variable
            $stmt = $this->pdo->prepare('UPDATE custom_variables SET name = ?, description = ? WHERE id = ?');
            $stmt->execute([$name, $description, $id]);
            
            // Return the updated variable
            $stmt = $this->pdo->prepare('SELECT * FROM custom_variables WHERE id = ?');
            $stmt->execute([$id]);
            $variable = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::json(['success' => true, 'data' => $variable]);
        } catch (Exception $e) {
            Logger::error('Failed to update custom variable: ' . $e->getMessage());
            Response::json(['success' => false, 'error' => 'Failed to update custom variable'], 500);
        }
    }

    public function delete($id) {
        try {
            // Check if variable exists
            $stmt = $this->pdo->prepare('SELECT id FROM custom_variables WHERE id = ?');
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                Response::json(['success' => false, 'error' => 'Variable not found'], 404);
                return;
            }

            // Delete variable
            $stmt = $this->pdo->prepare('DELETE FROM custom_variables WHERE id = ?');
            $stmt->execute([$id]);
            
            Response::json(['success' => true, 'message' => 'Variable deleted successfully']);
        } catch (Exception $e) {
            Logger::error('Failed to delete custom variable: ' . $e->getMessage());
            Response::json(['success' => false, 'error' => 'Failed to delete custom variable'], 500);
        }
    }
}