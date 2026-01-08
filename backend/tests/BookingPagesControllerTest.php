<?php

use PHPUnit\Framework\TestCase;

/**
 * Tests for BookingPagesController error handling when DB migrations are missing
 */
class BookingPagesControllerTest extends TestCase
{
    private static $pdo;
    private static $workspaceId = 1;

    public static function setUpBeforeClass(): void
    {
        require_once __DIR__ . '/../src/Database.php';
        require_once __DIR__ . '/../src/controllers/BookingPagesController.php';
        self::$pdo = Database::conn();
    }

    protected function setUp(): void
    {
        // Mock tenant context
        $GLOBALS['tenantContext'] = (object)['workspaceId' => self::$workspaceId];
    }

    /**
     * Ensure that when the booking_pages table is missing the controller returns
     * a friendly error message pointing to the migration file.
     *
     * @runInSeparateProcess
     */
    public function testIndexReturnsFriendlyErrorWhenTableMissing()
    {
        $pdo = self::$pdo;
        $renamed = false;

        // If booking_pages exists, rename it out of the way to simulate missing table
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE 'booking_pages'");
            $exists = $stmt->fetch();
            if ($exists) {
                $pdo->exec("RENAME TABLE booking_pages TO booking_pages_test_backup");
                $renamed = true;
            }
        } catch (Exception $e) {
            // If SHOW TABLES fails, assume table is missing already
        }

        // Call controller (it will output JSON and exit)
        ob_start();
        \BookingPagesController::index();
        $output = ob_get_clean();

        $response = json_decode($output, true);

        $this->assertIsArray($response);
        $this->assertArrayHasKey('error', $response);
        $this->assertStringContainsString('Booking pages tables are missing', $response['error']);

        // Restore table if we renamed it
        if ($renamed) {
            $pdo->exec("RENAME TABLE booking_pages_test_backup TO booking_pages");
        }
    }
}
