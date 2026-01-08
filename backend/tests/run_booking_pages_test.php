<?php
// Simple runner for BookingPagesControllerTest without PHPUnit dependency
require_once __DIR__ . '/BookingPagesControllerTest.php';

echo "Running BookingPagesControllerTest::testIndexReturnsFriendlyErrorWhenTableMissing\n";

try {
    // Call PHPUnit lifecycle methods manually
    if (method_exists('BookingPagesControllerTest', 'setUpBeforeClass')) {
        BookingPagesControllerTest::setUpBeforeClass();
    }

    $test = new BookingPagesControllerTest();
    if (method_exists($test, 'setUp')) {
        $test->setUp();
    }

    $test->testIndexReturnsFriendlyErrorWhenTableMissing();

    echo "✔ Test passed\n";
} catch (Throwable $e) {
    echo "✖ Test failed: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
} finally {
    if (method_exists('BookingPagesControllerTest', 'tearDownAfterClass')) {
        BookingPagesControllerTest::tearDownAfterClass();
    }
}
