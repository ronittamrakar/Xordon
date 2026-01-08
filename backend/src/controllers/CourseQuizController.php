<?php
/**
 * Course Quiz Controller
 * Manage quizzes, questions, and attempts for LMS
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class CourseQuizController {
    
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        return 1;
    }

    /**
     * GET /courses/{courseId}/quizzes
     */
    public static function index(string $courseId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $stmt = $pdo->prepare("
            SELECT q.*, 
                   (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
                   (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id) as attempt_count
            FROM course_quizzes q
            WHERE q.course_id = ? AND q.workspace_id = ?
            ORDER BY q.position ASC, q.created_at ASC
        ");
        $stmt->execute([$courseId, $workspaceId]);
        $quizzes = $stmt->fetchAll();

        Response::json(['items' => $quizzes]);
    }

    /**
     * GET /quizzes/{id}
     */
    public static function show(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $stmt = $pdo->prepare("SELECT * FROM course_quizzes WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        $quiz = $stmt->fetch();

        if (!$quiz) {
            Response::error('Quiz not found', 404);
            return;
        }

        // Get questions with options
        $stmt = $pdo->prepare("
            SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY position ASC
        ");
        $stmt->execute([$id]);
        $questions = $stmt->fetchAll();

        foreach ($questions as &$question) {
            $stmt = $pdo->prepare("
                SELECT * FROM quiz_question_options WHERE question_id = ? ORDER BY position ASC
            ");
            $stmt->execute([$question['id']]);
            $question['options'] = $stmt->fetchAll();
        }

        $quiz['questions'] = $questions;

        Response::json($quiz);
    }

    /**
     * POST /courses/{courseId}/quizzes
     */
    public static function create(string $courseId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        $workspaceId = self::getWorkspaceId();

        $title = trim($body['title'] ?? '');
        if (!$title) {
            Response::error('Title is required', 422);
            return;
        }

        $stmt = $pdo->prepare("
            INSERT INTO course_quizzes (
                workspace_id, course_id, module_id, lesson_id, title, description,
                time_limit_minutes, passing_score, max_attempts, shuffle_questions,
                show_correct_answers, is_required, status, position, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $workspaceId,
            $courseId,
            $body['module_id'] ?? null,
            $body['lesson_id'] ?? null,
            $title,
            $body['description'] ?? '',
            (int)($body['time_limit_minutes'] ?? 0),
            (int)($body['passing_score'] ?? 70),
            (int)($body['max_attempts'] ?? 0),
            (int)($body['shuffle_questions'] ?? false),
            (int)($body['show_correct_answers'] ?? true),
            (int)($body['is_required'] ?? false),
            $body['status'] ?? 'draft',
            (int)($body['position'] ?? 0)
        ]);

        $id = $pdo->lastInsertId();

        $stmt = $pdo->prepare("SELECT * FROM course_quizzes WHERE id = ?");
        $stmt->execute([$id]);
        $quiz = $stmt->fetch();

        Response::json($quiz, 201);
    }

    /**
     * PUT /quizzes/{id}
     */
    public static function update(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        $workspaceId = self::getWorkspaceId();

        $updates = [];
        $params = [];

        $fields = ['title', 'description', 'time_limit_minutes', 'passing_score', 
                   'max_attempts', 'shuffle_questions', 'show_correct_answers', 
                   'is_required', 'status', 'position', 'module_id', 'lesson_id'];

        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }

        if (empty($updates)) {
            Response::error('No fields to update', 422);
            return;
        }

        $params[] = $id;
        $params[] = $workspaceId;

        $stmt = $pdo->prepare("UPDATE course_quizzes SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?");
        $stmt->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM course_quizzes WHERE id = ?");
        $stmt->execute([$id]);
        $quiz = $stmt->fetch();

        Response::json($quiz);
    }

    /**
     * DELETE /quizzes/{id}
     */
    public static function delete(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $stmt = $pdo->prepare("DELETE FROM course_quizzes WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);

        Response::json(['success' => true]);
    }

    // =====================================================
    // QUESTIONS
    // =====================================================

    /**
     * POST /quizzes/{quizId}/questions
     */
    public static function createQuestion(string $quizId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();

        $questionText = trim($body['question_text'] ?? '');
        $questionType = $body['question_type'] ?? 'multiple_choice';

        if (!$questionText) {
            Response::error('Question text is required', 422);
            return;
        }

        // Get next position
        $stmt = $pdo->prepare("SELECT COALESCE(MAX(position), -1) + 1 FROM quiz_questions WHERE quiz_id = ?");
        $stmt->execute([$quizId]);
        $position = $stmt->fetchColumn();

        $stmt = $pdo->prepare("
            INSERT INTO quiz_questions (quiz_id, question_type, question_text, question_media_url, points, position, explanation, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $quizId,
            $questionType,
            $questionText,
            $body['question_media_url'] ?? null,
            (int)($body['points'] ?? 1),
            $position,
            $body['explanation'] ?? null
        ]);

        $questionId = $pdo->lastInsertId();

        // Create options if provided
        if (!empty($body['options']) && is_array($body['options'])) {
            $stmt = $pdo->prepare("
                INSERT INTO quiz_question_options (question_id, option_text, is_correct, match_text, position)
                VALUES (?, ?, ?, ?, ?)
            ");
            foreach ($body['options'] as $i => $option) {
                $stmt->execute([
                    $questionId,
                    $option['option_text'] ?? '',
                    (int)($option['is_correct'] ?? false),
                    $option['match_text'] ?? null,
                    $i
                ]);
            }
        }

        // Return full question with options
        $stmt = $pdo->prepare("SELECT * FROM quiz_questions WHERE id = ?");
        $stmt->execute([$questionId]);
        $question = $stmt->fetch();

        $stmt = $pdo->prepare("SELECT * FROM quiz_question_options WHERE question_id = ? ORDER BY position");
        $stmt->execute([$questionId]);
        $question['options'] = $stmt->fetchAll();

        Response::json($question, 201);
    }

    /**
     * PUT /questions/{id}
     */
    public static function updateQuestion(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();

        $updates = [];
        $params = [];

        $fields = ['question_type', 'question_text', 'question_media_url', 'points', 'position', 'explanation'];

        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }

        if (!empty($updates)) {
            $params[] = $id;
            $stmt = $pdo->prepare("UPDATE quiz_questions SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);
        }

        // Update options if provided
        if (isset($body['options']) && is_array($body['options'])) {
            // Delete existing options
            $stmt = $pdo->prepare("DELETE FROM quiz_question_options WHERE question_id = ?");
            $stmt->execute([$id]);

            // Insert new options
            $stmt = $pdo->prepare("
                INSERT INTO quiz_question_options (question_id, option_text, is_correct, match_text, position)
                VALUES (?, ?, ?, ?, ?)
            ");
            foreach ($body['options'] as $i => $option) {
                $stmt->execute([
                    $id,
                    $option['option_text'] ?? '',
                    (int)($option['is_correct'] ?? false),
                    $option['match_text'] ?? null,
                    $i
                ]);
            }
        }

        // Return updated question
        $stmt = $pdo->prepare("SELECT * FROM quiz_questions WHERE id = ?");
        $stmt->execute([$id]);
        $question = $stmt->fetch();

        $stmt = $pdo->prepare("SELECT * FROM quiz_question_options WHERE question_id = ? ORDER BY position");
        $stmt->execute([$id]);
        $question['options'] = $stmt->fetchAll();

        Response::json($question);
    }

    /**
     * DELETE /questions/{id}
     */
    public static function deleteQuestion(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare("DELETE FROM quiz_questions WHERE id = ?");
        $stmt->execute([$id]);

        Response::json(['success' => true]);
    }

    // =====================================================
    // ATTEMPTS
    // =====================================================

    /**
     * POST /quizzes/{quizId}/start
     * Start a new quiz attempt
     */
    public static function startAttempt(string $quizId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        // Get quiz
        $stmt = $pdo->prepare("SELECT * FROM course_quizzes WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$quizId, $workspaceId]);
        $quiz = $stmt->fetch();

        if (!$quiz) {
            Response::error('Quiz not found', 404);
            return;
        }

        // Check max attempts
        if ($quiz['max_attempts'] > 0) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?");
            $stmt->execute([$quizId, $userId]);
            $attemptCount = $stmt->fetchColumn();

            if ($attemptCount >= $quiz['max_attempts']) {
                Response::error('Maximum attempts reached', 403);
                return;
            }
        }

        // Get attempt number
        $stmt = $pdo->prepare("SELECT COALESCE(MAX(attempt_number), 0) + 1 FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?");
        $stmt->execute([$quizId, $userId]);
        $attemptNumber = $stmt->fetchColumn();

        // Calculate max score
        $stmt = $pdo->prepare("SELECT SUM(points) FROM quiz_questions WHERE quiz_id = ?");
        $stmt->execute([$quizId]);
        $maxScore = $stmt->fetchColumn() ?: 0;

        $stmt = $pdo->prepare("
            INSERT INTO quiz_attempts (quiz_id, user_id, started_at, max_score, attempt_number, created_at)
            VALUES (?, ?, NOW(), ?, ?, NOW())
        ");
        $stmt->execute([$quizId, $userId, $maxScore, $attemptNumber]);

        $attemptId = $pdo->lastInsertId();

        // Get questions (shuffle if configured)
        $orderBy = $quiz['shuffle_questions'] ? 'RAND()' : 'position ASC';
        $stmt = $pdo->prepare("SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY $orderBy");
        $stmt->execute([$quizId]);
        $questions = $stmt->fetchAll();

        // Get options for each question (don't show is_correct to user)
        foreach ($questions as &$question) {
            $stmt = $pdo->prepare("
                SELECT id, question_id, option_text, position 
                FROM quiz_question_options 
                WHERE question_id = ? 
                ORDER BY position ASC
            ");
            $stmt->execute([$question['id']]);
            $question['options'] = $stmt->fetchAll();
        }

        Response::json([
            'attempt_id' => $attemptId,
            'quiz' => [
                'id' => $quiz['id'],
                'title' => $quiz['title'],
                'time_limit_minutes' => $quiz['time_limit_minutes'],
                'question_count' => count($questions)
            ],
            'questions' => $questions
        ], 201);
    }

    /**
     * POST /attempts/{attemptId}/submit
     * Submit quiz answers
     */
    public static function submitAttempt(string $attemptId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();

        // Get attempt
        $stmt = $pdo->prepare("SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?");
        $stmt->execute([$attemptId, $userId]);
        $attempt = $stmt->fetch();

        if (!$attempt) {
            Response::error('Attempt not found', 404);
            return;
        }

        if ($attempt['completed_at']) {
            Response::error('Attempt already submitted', 400);
            return;
        }

        // Get quiz
        $stmt = $pdo->prepare("SELECT * FROM course_quizzes WHERE id = ?");
        $stmt->execute([$attempt['quiz_id']]);
        $quiz = $stmt->fetch();

        $answers = $body['answers'] ?? [];
        $totalScore = 0;
        $maxScore = 0;

        // Process each answer
        foreach ($answers as $answer) {
            $questionId = $answer['question_id'] ?? null;
            if (!$questionId) continue;

            // Get question
            $stmt = $pdo->prepare("SELECT * FROM quiz_questions WHERE id = ?");
            $stmt->execute([$questionId]);
            $question = $stmt->fetch();
            if (!$question) continue;

            $maxScore += $question['points'];
            $isCorrect = false;
            $pointsEarned = 0;

            if ($question['question_type'] === 'multiple_choice' || $question['question_type'] === 'true_false') {
                $selectedOptionId = $answer['selected_option_id'] ?? null;
                if ($selectedOptionId) {
                    $stmt = $pdo->prepare("SELECT is_correct FROM quiz_question_options WHERE id = ?");
                    $stmt->execute([$selectedOptionId]);
                    $option = $stmt->fetch();
                    $isCorrect = $option && $option['is_correct'];
                    if ($isCorrect) {
                        $pointsEarned = $question['points'];
                        $totalScore += $pointsEarned;
                    }
                }
            } elseif ($question['question_type'] === 'short_answer') {
                // For short answer, mark as pending review
                $isCorrect = null;
            }

            // Save answer
            $stmt = $pdo->prepare("
                INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_option_id, text_answer, is_correct, points_earned, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $attemptId,
                $questionId,
                $answer['selected_option_id'] ?? null,
                $answer['text_answer'] ?? null,
                $isCorrect === null ? null : (int)$isCorrect,
                $pointsEarned
            ]);
        }

        // Calculate percentage and pass status
        $percentage = $maxScore > 0 ? round(($totalScore / $maxScore) * 100, 2) : 0;
        $passed = $percentage >= $quiz['passing_score'];

        // Calculate time spent
        $startedAt = new DateTime($attempt['started_at']);
        $now = new DateTime();
        $timeSpent = $now->getTimestamp() - $startedAt->getTimestamp();

        // Update attempt
        $stmt = $pdo->prepare("
            UPDATE quiz_attempts SET 
                completed_at = NOW(),
                score = ?,
                max_score = ?,
                percentage = ?,
                passed = ?,
                time_spent_seconds = ?
            WHERE id = ?
        ");
        $stmt->execute([$totalScore, $maxScore, $percentage, (int)$passed, $timeSpent, $attemptId]);

        Response::json([
            'score' => $totalScore,
            'max_score' => $maxScore,
            'percentage' => $percentage,
            'passed' => $passed,
            'passing_score' => $quiz['passing_score'],
            'time_spent_seconds' => $timeSpent
        ]);
    }

    /**
     * GET /attempts/{attemptId}/results
     * Get detailed results for an attempt
     */
    public static function getAttemptResults(string $attemptId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare("
            SELECT a.*, q.title as quiz_title, q.show_correct_answers
            FROM quiz_attempts a
            JOIN course_quizzes q ON a.quiz_id = q.id
            WHERE a.id = ? AND a.user_id = ?
        ");
        $stmt->execute([$attemptId, $userId]);
        $attempt = $stmt->fetch();

        if (!$attempt) {
            Response::error('Attempt not found', 404);
            return;
        }

        // Get answers with question details
        $showCorrect = $attempt['show_correct_answers'];
        $stmt = $pdo->prepare("
            SELECT aa.*, qq.question_text, qq.question_type, qq.points, qq.explanation
            FROM quiz_attempt_answers aa
            JOIN quiz_questions qq ON aa.question_id = qq.id
            WHERE aa.attempt_id = ?
        ");
        $stmt->execute([$attemptId]);
        $answers = $stmt->fetchAll();

        // Add options if showing correct answers
        if ($showCorrect) {
            foreach ($answers as &$answer) {
                $stmt = $pdo->prepare("SELECT * FROM quiz_question_options WHERE question_id = ? ORDER BY position");
                $stmt->execute([$answer['question_id']]);
                $answer['options'] = $stmt->fetchAll();
            }
        }

        $attempt['answers'] = $answers;

        Response::json($attempt);
    }

    /**
     * GET /quizzes/{quizId}/attempts
     * Get all attempts for a quiz (for instructors)
     */
    public static function getQuizAttempts(string $quizId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $workspaceId = self::getWorkspaceId();

        $stmt = $pdo->prepare("
            SELECT a.*, u.name as user_name, u.email as user_email
            FROM quiz_attempts a
            JOIN users u ON a.user_id = u.id
            JOIN course_quizzes q ON a.quiz_id = q.id
            WHERE a.quiz_id = ? AND q.workspace_id = ?
            ORDER BY a.created_at DESC
        ");
        $stmt->execute([$quizId, $workspaceId]);
        $attempts = $stmt->fetchAll();

        Response::json(['items' => $attempts]);
    }
}
