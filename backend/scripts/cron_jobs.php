<?php
/**
 * Cron Job Configuration
 * Add these to your system crontab or Windows Task Scheduler
 */

// ============================================
// LINUX/MAC CRONTAB ENTRIES
// ============================================
// Run: crontab -e
// Add these lines:

// Log rotation - Daily at 2 AM
// 0 2 * * * /usr/bin/php /path/to/backend/scripts/rotate_logs.php >> /path/to/logs/cron.log 2>&1

// Clean up expired auth tokens - Every 6 hours
// 0 */6 * * * /usr/bin/php /path/to/backend/scripts/cleanup_tokens.php >> /path/to/logs/cron.log 2>&1

// Database optimization - Weekly on Sunday at 3 AM
// 0 3 * * 0 /usr/bin/php /path/to/backend/scripts/optimize_database.php >> /path/to/logs/cron.log 2>&1

// Backup database - Daily at 1 AM
// 0 1 * * * /usr/bin/php /path/to/backend/scripts/backup_database.php >> /path/to/logs/cron.log 2>&1


// ============================================
// WINDOWS TASK SCHEDULER POWERSHELL SCRIPT
// ============================================
/*
# Save as setup-scheduled-tasks.ps1 and run with administrator privileges

# Log Rotation - Daily at 2 AM
$Action = New-ScheduledTaskAction -Execute "php.exe" -Argument "C:\path\to\backend\scripts\rotate_logs.php"
$Trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName "Xordon-LogRotation" -Description "Rotate application logs"

# Token Cleanup - Every 6 hours
$Action = New-ScheduledTaskAction -Execute "php.exe" -Argument "C:\path\to\backend\scripts\cleanup_tokens.php"
$Trigger = New-ScheduledTaskTrigger -Once -At 12:00AM -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration ([TimeSpan]::MaxValue)
Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName "Xordon-TokenCleanup" -Description "Clean up expired tokens"

# Database Optimization - Weekly on Sunday at 3 AM
$Action = New-ScheduledTaskAction -Execute "php.exe" -Argument "C:\path\to\backend\scripts\optimize_database.php"
$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3:00AM
Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName "Xordon-DatabaseOptimization" -Description "Optimize database tables"

# Database Backup - Daily at 1 AM
$Action = New-ScheduledTaskAction -Execute "php.exe" -Argument "C:\path\to\backend\scripts\backup_database.php"
$Trigger = New-ScheduledTaskTrigger -Daily -At 1:00AM
Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName "Xordon-DatabaseBackup" -Description "Backup database"
*/


// ============================================
// VERIFICATION
// ============================================
echo "Cron job configuration file\n";
echo "See comments above for setup instructions\n";
echo "\nTo verify cron jobs are set up:\n";
echo "Linux/Mac: crontab -l\n";
echo "Windows: Get-ScheduledTask | Where-Object {\$_.TaskName -like 'Xordon-*'}\n";
