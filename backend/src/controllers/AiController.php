<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/AiService.php';

class AiController {
    public static function generate(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        if (!is_array($body)) {
            Response::json(['error' => 'Invalid payload'], 400);
            return;
        }

        try {
            $service = new AiService(Database::conn());
            $result = $service->generate($userId, $body);
            Response::json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (Throwable $e) {
            $status = $e instanceof InvalidArgumentException ? 422 : 400;
            Response::json([
                'error' => $e->getMessage(),
            ], $status);
        }
    }
}
