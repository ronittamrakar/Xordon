<#
Safely archive old log files from backend/logs.
Default behavior: dry-run that lists candidate files.
Use -Days and -MinSizeMB to adjust selection.
Use -Execute to actually compress and remove originals.
#>
param(
    [int]$Days = 30,
    [int]$MinSizeMB = 1,
    [switch]$Execute,
    [string]$ArchiveDir = "backend\logs\archive"
)

# Ensure archive dir exists
if (-not (Test-Path -Path $ArchiveDir)) {
    New-Item -ItemType Directory -Path $ArchiveDir -Force | Out-Null
}

$cutoff = (Get-Date).AddDays(-$Days)
$candidates = Get-ChildItem backend\logs -File -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt $cutoff -and $_.Length -gt ($MinSizeMB * 1MB) } |
    Sort-Object Length -Descending

if ($candidates.Count -eq 0) {
    Write-Output "No log files older than $Days days and larger than $MinSizeMB MB were found."
    exit 0
}

Write-Output "Found $($candidates.Count) candidate file(s) (older than $Days days and > $MinSizeMB MB):"
$candidates | ForEach-Object { "{0}`t{1} MB`tLastWrite: {2}" -f $_.FullName, [math]::Round($_.Length/1MB,2), $_.LastWriteTime }

if (-not $Execute) {
    Write-Output "\nDry-run mode (no changes made). To compress and remove originals, re-run with -Execute."
    exit 0
}

# Create archive file per run
$timestamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
$zipName = Join-Path $ArchiveDir "logs_archive_$timestamp.zip"

try {
    $paths = $candidates | Select-Object -ExpandProperty FullName
    Write-Output "Compressing $($paths.Count) files into $zipName ..."
    Compress-Archive -Path $paths -DestinationPath $zipName -Force

    # Verify zip exists and has size
    if (Test-Path $zipName -PathType Leaf -ErrorAction SilentlyContinue) {
        $zipSizeMB = [math]::Round((Get-Item $zipName).Length/1MB,2)
        Write-Output "Archive created ($zipSizeMB MB). Removing original files..."
        $candidates | Remove-Item -Force
        Write-Output "Done. Archive stored at: $zipName"
        exit 0
    } else {
        Write-Error "Archive creation failed. Originals preserved."
        exit 1
    }
} catch {
    Write-Error "An error occurred: $_"
    exit 1
}
