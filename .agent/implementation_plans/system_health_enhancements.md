# System Health Dashboard Enhancements
The following enhancements have been made to the System Health Dashboard to ensure comprehensiveness, real-time updates, and correct data scoping.

## Backend Changes - SystemHealthController.php
- **Consolidation**: Incorporated functionality from `SystemToolsController.php` and `SecurityController.php` into `SystemHealthController.php` to create a unified API source.
- **New Methods Added**:
    - `getLogs()`: Retrieves application logs from `logs/app.log` with filtering and pagination.
    - `getCacheKeys()`: Lists file-based cache keys from `cache/` directory.
    - `deleteCacheKey($key)`: Deletes a specific cache file.
    - `getServerResources()`: Returns real-time CPU, Memory, and Disk usage (delegates to `getInternalPerformanceMetrics`).
    - `maintenanceMode()`: GET/POST to check or toggle maintenance mode using `maintenance.flag`.
    - `testEmail()`: Sends a test email using `NotificationSender`.
- **Security Logic**: ensured `getSecurityEvents` and `getSecurityStats` use the reliable `rbac_audit_log` table instead of the missing `security_events` table.

## Backend Changes - index.php
- **Route Updates**: Redirected all `/system/tools/*` and `/system/security/*` routes to use `SystemHealthController`.
    - `/system/tools/logs` -> `SystemHealthController::getLogs`
    - `/system/tools/cache` -> `SystemHealthController::getCacheKeys`
    - `/system/tools/resources` -> `SystemHealthController::getServerResources`
    - `/system/tools/test-email` -> `SystemHealthController::testEmail`
    - `/system/tools/maintenance` -> `SystemHealthController::maintenanceMode`
    - `/system/security/events` -> `SystemHealthController::getSecurityEvents`
    - `/system/security/stats` -> `SystemHealthController::getSecurityStats`

## Frontend Changes - SystemHealth.tsx
- **Real-time Updates**: 
    - Decreased the data refresh interval from 60 seconds to 10 seconds.
    - Added `fetchLogs()` and `fetchCache()` to the periodic refresh cycle to ensure these tabs also stay updated without manual refresh.
