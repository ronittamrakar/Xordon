<?php
namespace Xordon;

use PDO;
use PDOException;
use Exception;

class Database {
    private static ?PDO $pdo = null;

    public static function conn(): PDO {
        if (self::$pdo === null) {
            $host = self::getEnv('DB_HOST', '127.0.0.1');
            $port = self::getEnv('DB_PORT', '3306');
            $dbname = self::getEnv('DB_NAME', 'xordon');
            $user = self::getEnv('DB_USER', 'root');
            $pass = self::getEnv('DB_PASS', '');
            
            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            
            try {
                self::$pdo = new \PDO($dsn, $user, $pass, [
                    \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                    \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                    \PDO::ATTR_EMULATE_PREPARES => false
                ]);
            } catch (\PDOException $e) {
                if (!headers_sent()) {
                    header('Content-Type: application/json');
                    http_response_code(500);
                }
                echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
                exit;
            }
        }
        return self::$pdo;
    }


    private static function getEnv(string $key, string $default = ''): string {
        if (array_key_exists($key, $_ENV)) return $_ENV[$key];
        $val = getenv($key);
        if ($val !== false) return $val;
        if (array_key_exists($key, $_SERVER)) return $_SERVER[$key];
        return $default;
    }

    public static function query(string $sql, array $params = []): \PDOStatement {
        $stmt = self::conn()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function select(string $sql, array $params = []): array {
        return self::query($sql, $params)->fetchAll();
    }

    public static function first(string $sql, array $params = []): ?array {
        $result = self::query($sql, $params)->fetch();
        return $result ?: null;
    }

    public static function execute(string $sql, array $params = []): bool {
        return self::query($sql, $params)->rowCount() > 0;
    }

    public static function getHealthStatus(): array {
        $status = [
            'connected' => false,
            'message' => 'Not connected',
            'host' => self::getEnv('DB_HOST', '127.0.0.1'),
            'database' => self::getEnv('DB_NAME', 'xordon'),
        ];

        try {
            if (self::$pdo === null) {
                self::conn();
            }
            $status['connected'] = true;
            $status['message'] = 'Connected successfully';
        } catch (PDOException $e) {
            $status['message'] = $e->getMessage();
        }

        return $status;
    }
}

// Global alias for compatibility
if (!class_exists('\\Database')) {
    class_alias('\\Xordon\\Database', '\\Database');
}