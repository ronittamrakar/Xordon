#!/usr/bin/env pwsh

# Script to remove duplicate padding from pages
# This fixes the issue where pages have container mx-auto px-* py-* classes
# that conflict with AppLayout's built-in padding

$files = @(
    "d:\Backup\App Backups\Xordon\src\pages\operations\ClientAccounts.tsx",
    "d:\Backup\App Backups\Xordon\src\pages\operations\IndustrySettings.tsx",
    "d:\Backup\App Backups\Xordon\src\pages\operations\Services.tsx",
    "d:\Backup\App Backups\Xordon\src\pages\operations\Jobs.tsx",
    "d:\Backup\App Backups\Xordon\src\pages\operations\Requests.tsx",
    "d:\Backup\App Backups\Xordon\src\pages\operations\Recalls.tsx",
    "d:\Backup\App Backups\Xordon\src\pages\operations\StaffMembers.tsx",
    "d:\Backup\App Backups\Xordon\src\pages\operations\IntakeForms.tsx",
    "d:\Backup\App Backups\Xordon\src\pages\operations\Playbooks.tsx",
    "d:\Backup\App Backups\Xordon\src\pages\operations\FieldService.tsx",
    "d:\Backup\App Backups\Xordon\src\pages\operations\LocalPayments.tsx",
    "d:\Backup\App Backups\Xordon\src\pages\operations\PhoneLines.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing: $file"
        $content = Get-Content $file -Raw
        
        # Replace container mx-auto with px/py padding with just space-y
        $content = $content -replace 'className="container mx-auto px-\d+ py-\d+([^"]*)"', 'className="space-y-6$1"'
        $content = $content -replace 'className="container mx-auto py-\d+([^"]*)"', 'className="space-y-6$1"'
        $content = $content -replace 'className="container mx-auto px-\d+([^"]*)"', 'className="space-y-6$1"'
        
        Set-Content $file -Value $content -NoNewline
        Write-Host "✓ Fixed: $file"
    } else {
        Write-Host "⚠ Not found: $file"
    }
}

Write-Host "`nDone! Fixed padding issues in pages."
