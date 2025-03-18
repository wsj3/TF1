# Backup Files Script for Therapist's Friend
# This script creates a complete backup of ALL files and folders in the project directory with NO exclusions

Write-Host "Therapist's Friend - Complete File Backup Script" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# Get current timestamp for the backup folder name
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups/full_backup_$timestamp"

# Create the backup directory if it doesn't exist
if (-not (Test-Path "backups")) {
    New-Item -Path "backups" -ItemType Directory | Out-Null
    Write-Host "Created backups directory" -ForegroundColor Green
}

# Create timestamp directory
New-Item -Path $backupDir -ItemType Directory | Out-Null
Write-Host "Created backup directory: $backupDir" -ForegroundColor Green

# Copy ALL files and folders to the backup directory with no exclusions
Write-Host "Starting complete backup (including all files and directories)..." -ForegroundColor Yellow
Write-Host "This may take some time if node_modules is large..." -ForegroundColor Yellow

# Use robocopy for a more efficient copy operation
robocopy . $backupDir /E /NFL /NDL /NJH /NJS /nc /ns /np

# If robocopy fails, fall back to PowerShell's Copy-Item
if ($LASTEXITCODE -ge 8) {
    Write-Host "Robocopy encountered issues. Falling back to PowerShell Copy-Item..." -ForegroundColor Yellow
    Get-ChildItem -Path "." -Force | ForEach-Object {
        if ($_.PSIsContainer) {
            # It's a directory
            $targetDir = Join-Path -Path $backupDir -ChildPath $_.Name
            Write-Host "Backing up directory: $($_.Name)" -ForegroundColor Gray
            Copy-Item -Path $_.FullName -Destination $targetDir -Recurse -Force
        } else {
            # It's a file
            Write-Host "Backing up file: $($_.Name)" -ForegroundColor Gray
            Copy-Item -Path $_.FullName -Destination $backupDir -Force
        }
    }
}

Write-Host "Backup completed successfully!" -ForegroundColor Green
Write-Host "Backup stored in: $backupDir" -ForegroundColor Cyan

# Display backup size
$backupSize = (Get-ChildItem -Path $backupDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Backup size: $([math]::Round($backupSize, 2)) MB" -ForegroundColor Cyan

# List of backups
Write-Host "`nExisting backups:" -ForegroundColor Yellow
Get-ChildItem -Path "backups" -Directory | Where-Object { $_.Name -like "full_backup_*" } | ForEach-Object {
    $size = (Get-ChildItem -Path $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "$($_.Name) - $([math]::Round($size, 2)) MB" -ForegroundColor White
} 