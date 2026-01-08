<?php
/**
 * Scheduling API Routes - Appointments, Booking Types, Video Providers
 */

require_once __DIR__ . '/../../src/controllers/AppointmentsController.php';
require_once __DIR__ . '/../../src/controllers/VideoProvidersController.php';
require_once __DIR__ . '/../../src/controllers/BookingController.php';
require_once __DIR__ . '/../../src/controllers/BookingPagesController.php';

$path = $_GET['path'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================
// VIDEO PROVIDERS
// ============================================

// Get connected video providers
if ($path === 'video/connections' && $method === 'GET') {
    return VideoProvidersController::getConnections();
}

// Get OAuth URL for connecting a provider
if ($path === 'video/auth-url' && $method === 'POST') {
    return VideoProvidersController::getAuthUrl();
}

// OAuth callbacks
if (preg_match('#^video/(zoom|google|teams)/callback$#', $path, $m) && $method === 'GET') {
    return VideoProvidersController::handleCallback($m[1]);
}

// Disconnect a provider
if (preg_match('#^video/connections/(\d+)$#', $path, $m) && $method === 'DELETE') {
    return VideoProvidersController::disconnect($m[1]);
}

// Create video meeting for an appointment
if ($path === 'video/meetings' && $method === 'POST') {
    return VideoProvidersController::createMeeting();
}

// Delete video meeting
if (preg_match('#^video/meetings/(\d+)$#', $path, $m) && $method === 'DELETE') {
    return VideoProvidersController::deleteMeeting($m[1]);
}

// Get video meeting details
if (preg_match('#^video/meetings/(\d+)$#', $path, $m) && $method === 'GET') {
    return VideoProvidersController::getMeetingDetails($m[1]);
}

// ============================================
// BOOKING TYPES
// ============================================

// List booking types
if ($path === 'booking-types' && $method === 'GET') {
    return AppointmentsController::getBookingTypes();
}

// Create booking type
if ($path === 'booking-types' && $method === 'POST') {
    return AppointmentsController::createBookingType();
}

// Get single booking type
if (preg_match('#^booking-types/(\d+)$#', $path, $m) && $method === 'GET') {
    return AppointmentsController::getBookingType($m[1]);
}

// Update booking type
if (preg_match('#^booking-types/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
    return AppointmentsController::updateBookingType($m[1]);
}

// Delete booking type
if (preg_match('#^booking-types/(\d+)$#', $path, $m) && $method === 'DELETE') {
    return AppointmentsController::deleteBookingType($m[1]);
}

// ============================================
// APPOINTMENTS
// ============================================

// AppointmentsV2 routes (must be before generic appointments routes)
require_once __DIR__ . '/../../src/controllers/AppointmentsV2Controller.php';

if ($path === 'appointments/v2' && $method === 'GET') {
    return AppointmentsV2Controller::listAppointments();
}

if ($path === 'appointments/v2/book' && $method === 'POST') {
    return AppointmentsV2Controller::bookAppointment();
}

if ($path === 'appointments/v2/stats' && $method === 'GET') {
    return AppointmentsV2Controller::getStats();
}

if (preg_match('#^appointments/v2/(\d+)/status$#', $path, $m) && $method === 'POST') {
    return AppointmentsV2Controller::updateAppointmentStatus((int)$m[1]);
}

// Regular appointments routes
// List appointments
if ($path === 'appointments' && $method === 'GET') {
    return AppointmentsController::getAppointments();
}

// Create appointment
if ($path === 'appointments' && $method === 'POST') {
    return AppointmentsController::createAppointment();
}

// Get single appointment
if (preg_match('#^appointments/(\d+)$#', $path, $m) && $method === 'GET') {
    return AppointmentsController::getAppointment($m[1]);
}

// Update appointment
if (preg_match('#^appointments/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
    return AppointmentsController::updateAppointment($m[1]);
}

// Delete appointment
if (preg_match('#^appointments/(\d+)$#', $path, $m) && $method === 'DELETE') {
    return AppointmentsController::deleteAppointment($m[1]);
}

// Cancel appointment
if (preg_match('#^appointments/(\d+)/cancel$#', $path, $m) && $method === 'POST') {
    return AppointmentsController::cancelAppointment($m[1]);
}

// Reschedule appointment
if (preg_match('#^appointments/(\d+)/reschedule$#', $path, $m) && $method === 'POST') {
    return AppointmentsController::rescheduleAppointment($m[1]);
}

// Dashboard stats (legacy)
if ($path === 'appointments/dashboard-stats' && $method === 'GET') {
    return AppointmentsController::getDashboardStats();
}

// Booking page settings (legacy)
if ($path === 'appointments/booking-page-settings' && $method === 'GET') {
    return AppointmentsController::getBookingPageSettings();
}
if ($path === 'appointments/booking-page-settings' && $method === 'POST') {
    return AppointmentsController::updateBookingPageSettings();
}

// Availability (legacy, schedules + overrides)
if ($path === 'appointments/availability' && $method === 'GET') {
    return AppointmentsController::getAvailability();
}

// ============================================
// AVAILABILITY
// ============================================

// Get availability schedules
if ($path === 'availability/schedules' && $method === 'GET') {
    return AppointmentsController::getAvailabilitySchedules();
}

// Save availability
if ($path === 'availability/save' && $method === 'POST') {
    return AppointmentsController::saveAvailability();
}

// Get availability slots
if ($path === 'availability/slots' && $method === 'GET') {
    return AppointmentsController::getAvailabilitySlots();
}

// Get availability overrides
if ($path === 'availability/overrides' && $method === 'GET') {
    return AppointmentsController::getAvailabilityOverrides();
}

// Add availability override
if ($path === 'availability/overrides' && $method === 'POST') {
    return AppointmentsController::addAvailabilityOverride();
}

// Delete availability override
if (preg_match('#^availability/overrides/(\d+)$#', $path, $m) && $method === 'DELETE') {
    return AppointmentsController::deleteAvailabilityOverride($m[1]);
}

// ============================================
// PUBLIC BOOKING
// ============================================

// Get public booking page
if (preg_match('#^public/booking/([^/]+)/([^/]+)$#', $path, $m) && $method === 'GET') {
    return AppointmentsController::getPublicBookingPage($m[1], $m[2]);
}

// Get available slots for public booking
if (preg_match('#^public/booking/([^/]+)/([^/]+)/slots$#', $path, $m) && $method === 'GET') {
    return AppointmentsController::getAvailableSlots($m[1], $m[2]);
}

// Book appointment (public)
if (preg_match('#^public/booking/([^/]+)/([^/]+)/book$#', $path, $m) && $method === 'POST') {
    return AppointmentsController::bookAppointment($m[1], $m[2]);
}

// ============================================
// BOOKING PAGES
// ============================================

// List booking pages
if ($path === 'booking-pages' && $method === 'GET') {
    return BookingPagesController::list();
}

// Create booking page
if ($path === 'booking-pages' && $method === 'POST') {
    return BookingPagesController::create();
}

// Get booking page
if (preg_match('#^booking-pages/(\d+)$#', $path, $m) && $method === 'GET') {
    return BookingPagesController::get($m[1]);
}

// Update booking page
if (preg_match('#^booking-pages/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
    return BookingPagesController::update($m[1]);
}

// Delete booking page
if (preg_match('#^booking-pages/(\d+)$#', $path, $m) && $method === 'DELETE') {
    return BookingPagesController::delete($m[1]);
}

// Get public booking page by slug
if (preg_match('#^public/book/([^/]+)$#', $path, $m) && $method === 'GET') {
    return BookingPagesController::getPublicPage($m[1]);
}

// Capture lead from booking page
if (preg_match('#^public/book/([^/]+)/lead$#', $path, $m) && $method === 'POST') {
    return BookingPagesController::captureLead($m[1]);
}

// ============================================
// ANALYTICS
// ============================================

require_once __DIR__ . '/../../src/controllers/SchedulingAnalyticsController.php';

// Get analytics dashboard
if ($path === 'analytics/dashboard' && $method === 'GET') {
    return SchedulingAnalyticsController::getDashboard();
}

// Get booking page funnel
if (preg_match('#^analytics/booking-pages/(\d+)/funnel$#', $path, $m) && $method === 'GET') {
    return SchedulingAnalyticsController::getBookingPageFunnel($m[1]);
}

// Track page view (public endpoint)
if ($path === 'analytics/track' && $method === 'POST') {
    return SchedulingAnalyticsController::trackPageView();
}

// Get video provider stats
if ($path === 'analytics/video-providers' && $method === 'GET') {
    return SchedulingAnalyticsController::getVideoProviderStats();
}

// Get staff performance
if ($path === 'analytics/staff-performance' && $method === 'GET') {
    return SchedulingAnalyticsController::getStaffPerformance();
}

// Export analytics
if ($path === 'analytics/export' && $method === 'GET') {
    return SchedulingAnalyticsController::exportAnalytics();
}

// ============================================
// CALENDAR SYNC
// ============================================

require_once __DIR__ . '/../../src/controllers/CalendarSyncController.php';

// Settings
if ($path === 'calendar-sync/settings' && $method === 'GET') return CalendarSyncController::getSettings();
if ($path === 'calendar-sync/settings' && ($method === 'PUT' || $method === 'POST')) return CalendarSyncController::updateSettings();

// OAuth
if ($path === 'calendar-sync/oauth/url' && $method === 'POST') return CalendarSyncController::getOAuthUrl();
if ($path === 'calendar-sync/oauth/callback' && $method === 'POST') return CalendarSyncController::completeOAuth();

// Connections
if ($path === 'calendar-sync/connections' && $method === 'GET') return CalendarSyncController::listConnections();
if (preg_match('#^calendar-sync/connections/(\d+)$#', $path, $m)) {
    if ($method === 'GET') return CalendarSyncController::getConnection($m[1]);
    if ($method === 'PUT') return CalendarSyncController::updateConnection($m[1]);
    if ($method === 'DELETE') return CalendarSyncController::deleteConnection($m[1]);
}

// Sync Operations
if (preg_match('#^calendar-sync/connections/(\d+)/sync$#', $path, $m) && $method === 'POST') return CalendarSyncController::syncNow($m[1]);
if ($path === 'calendar-sync/sync-all' && $method === 'POST') return CalendarSyncController::syncAll();

// Calendar Discovery
if (preg_match('#^calendar-sync/connections/(\d+)/calendars$#', $path, $m) && $method === 'GET') return CalendarSyncController::getExternalCalendars($m[1]);
if (preg_match('#^calendar-sync/connections/(\d+)/calendar$#', $path, $m) && $method === 'PUT') return CalendarSyncController::selectCalendar($m[1]);

// Availability Helpers
if ($path === 'calendar-sync/availability-blocks' && $method === 'GET') return CalendarSyncController::getAvailabilityBlocks();
if ($path === 'calendar-sync/check-conflicts' && $method === 'GET') return CalendarSyncController::checkConflicts();
if ($path === 'calendar-sync/available-slots' && $method === 'GET') return CalendarSyncController::getAvailableSlots();

// Export
if ($path === 'calendar-sync/export-appointment' && $method === 'POST') return CalendarSyncController::exportAppointment();
if (preg_match('#^calendar-sync/exported/(\d+)$#', $path, $m) && $method === 'DELETE') return CalendarSyncController::removeExported($m[1]);

// External Events
if ($path === 'calendar-sync/external-events' && $method === 'GET') return CalendarSyncController::getExternalEvents();


// ============================================
// HR SHIFT SCHEDULING (Recruitment & Shifts)
// ============================================

// Shifts
if ($path === 'scheduling/shifts' && $method === 'GET') {
    return ShiftSchedulingController::getShifts();
}
if ($path === 'scheduling/shifts' && $method === 'POST') {
    return ShiftSchedulingController::createShift();
}
if (preg_match('#^scheduling/shifts/(\d+)$#', $path, $m)) {
    $id = (int)$m[1];
    if ($method === 'PUT' || $method === 'PATCH') return ShiftSchedulingController::updateShift($id);
    if ($method === 'DELETE') return ShiftSchedulingController::deleteShift($id);
}
// Validate shift (conflict check)
if ($path === 'scheduling/shifts/validate' && $method === 'POST') {
    return ShiftSchedulingController::validateShift();
}

// Shift Types
if ($path === 'scheduling/shift-types' && $method === 'GET') {
    return ShiftSchedulingController::getShiftTypes();
}
if ($path === 'scheduling/shift-types' && $method === 'POST') {
    return ShiftSchedulingController::createShiftType();
}

// Swap Requests
if ($path === 'scheduling/swap-requests' && $method === 'GET') {
    return ShiftSchedulingController::getShiftSwapRequests();
}
if ($path === 'scheduling/swap-requests' && $method === 'POST') {
    return ShiftSchedulingController::createShiftSwapRequest();
}
if (preg_match('#^scheduling/swap-requests/(\d+)/respond$#', $path, $m) && $method === 'POST') {
    return ShiftSchedulingController::respondToSwapRequest((int)$m[1]);
}

// Availability (HR specific) - Prefix with scheduling/ to differentiate from Appointment availability
if ($path === 'scheduling/availability' && $method === 'GET') {
    return ShiftSchedulingController::getAvailability();
}
if ($path === 'scheduling/availability' && $method === 'POST') {
    return ShiftSchedulingController::setAvailability();
}

// Conflicts
if ($path === 'scheduling/conflicts' && $method === 'GET') {
    return ShiftSchedulingController::getConflicts();
}

// Analytics
if ($path === 'scheduling/analytics' && $method === 'GET') {
    return ShiftSchedulingController::getSchedulingAnalytics();
}

// 404 - Route not found
Response::json(['error' => 'Scheduling API endpoint not found', 'path' => $path, 'method' => $method], 404);
