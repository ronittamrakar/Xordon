<?php

require_once __DIR__ . '/../Database.php';

class TelephonyConfig
{
    public static function getSignalWireConfig(string $userId): ?array
    {
        $config = self::getConfigFromConnections($userId);
        if ($config) {
            return $config;
        }

        $config = self::getConfigFromSmsSettings($userId);
        if ($config) {
            return $config;
        }

        return self::getConfigFromEnv();
    }

    public static function ensureSignalWireConfig(string $userId): array
    {
        $config = self::getSignalWireConfig($userId);
        if (!$config || empty($config['projectId']) || empty($config['spaceUrl']) || empty($config['apiToken'])) {
            throw new Exception('SignalWire credentials not configured. Please configure them under Connections.');
        }

        return $config;
    }

    private static function getConfigFromConnections(string $userId): ?array
    {
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT config FROM connections WHERE user_id = ? AND provider = ? ORDER BY updated_at DESC LIMIT 1');
            $stmt->execute([$userId, 'signalwire']);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                return null;
            }

            $config = json_decode($row['config'] ?? '{}', true) ?: [];
            return self::normalizeConfig([
                'projectId' => $config['projectId'] ?? null,
                'spaceUrl' => $config['spaceUrl'] ?? null,
                'apiToken' => $config['apiToken'] ?? null,
                'defaultSenderNumber' => $config['defaultSenderNumber'] ?? null,
                'defaultCallerId' => $config['defaultCallerId'] ?? null,
            ]);
        } catch (Exception $e) {
            error_log('TelephonyConfig::getConfigFromConnections error: ' . $e->getMessage());
            return null;
        }
    }

    private static function getConfigFromSmsSettings(string $userId): ?array
    {
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT data FROM sms_settings WHERE user_id = ? LIMIT 1');
            $stmt->execute([$userId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                return null;
            }

            $data = json_decode($row['data'] ?? '{}', true) ?: [];
            if (empty($data['signalwireProjectId']) || empty($data['signalwireSpaceUrl']) || empty($data['signalwireApiToken'])) {
                return null;
            }

            return self::normalizeConfig([
                'projectId' => $data['signalwireProjectId'] ?? null,
                'spaceUrl' => $data['signalwireSpaceUrl'] ?? null,
                'apiToken' => $data['signalwireApiToken'] ?? null,
                'defaultSenderNumber' => $data['defaultSenderNumber'] ?? null,
                'defaultCallerId' => $data['defaultCallerId'] ?? null,
            ]);
        } catch (Exception $e) {
            error_log('TelephonyConfig::getConfigFromSmsSettings error: ' . $e->getMessage());
            return null;
        }
    }

    private static function getConfigFromEnv(): ?array
    {
        $projectId = $_ENV['SIGNALWIRE_PROJECT_ID'] ?? null;
        $spaceUrl = $_ENV['SIGNALWIRE_SPACE_URL'] ?? null;
        $apiToken = $_ENV['SIGNALWIRE_API_TOKEN'] ?? null;

        if (!$projectId || !$spaceUrl || !$apiToken) {
            return null;
        }

        return self::normalizeConfig([
            'projectId' => $projectId,
            'spaceUrl' => $spaceUrl,
            'apiToken' => $apiToken,
            'defaultSenderNumber' => $_ENV['SIGNALWIRE_DEFAULT_SENDER'] ?? null,
            'defaultCallerId' => $_ENV['SIGNALWIRE_DEFAULT_SENDER'] ?? null,
        ]);
    }

    private static function normalizeConfig(array $config): array
    {
        return [
            'projectId' => $config['projectId'] ?? null,
            'spaceUrl' => $config['spaceUrl'] ?? null,
            'apiToken' => $config['apiToken'] ?? null,
            'defaultSender' => $config['defaultSenderNumber'] ?? $config['defaultCallerId'] ?? null,
            'defaultSenderNumber' => $config['defaultSenderNumber'] ?? null,
            'defaultCallerId' => $config['defaultCallerId'] ?? $config['defaultSenderNumber'] ?? null,
        ];
    }
}
