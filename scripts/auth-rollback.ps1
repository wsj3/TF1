# Authentication Rollback Script
# This script provides a way to quickly roll back authentication changes
# if problems are detected in production.

# Stop on errors
$ErrorActionPreference = "Stop"

# Display header
Write-Host "====================================" -ForegroundColor Cyan
Write-Host " Authentication Rollback Utility     " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Environment variables
$backupDir = "./backups"
$envProdFile = ".env.production"
$envBackupFile = "$backupDir/env.production.backup"

# Check if we're running in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: This script must be run from the project root directory." -ForegroundColor Red
    exit 1
}

# Check if backup directory exists
if (-not (Test-Path $backupDir)) {
    Write-Host "Error: Backup directory not found. Expected at: $backupDir" -ForegroundColor Red
    exit 1
}

# Function to list available backups
function List-Backups {
    Write-Host "Available application backups:" -ForegroundColor Yellow
    
    $backups = Get-ChildItem -Path $backupDir -Filter "tf_backup_*.sql" | Sort-Object LastWriteTime -Descending
    
    if ($backups.Count -eq 0) {
        Write-Host "  No backups found in $backupDir" -ForegroundColor Red
        return $false
    }
    
    for ($i = 0; $i -lt $backups.Count; $i++) {
        $backup = $backups[$i]
        $date = $backup.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        Write-Host "  [$($i+1)] $($backup.Name) - Created: $date" -ForegroundColor Green
    }
    
    return $true
}

# Function to restore environment variables
function Restore-EnvFile {
    if (Test-Path $envBackupFile) {
        Write-Host "Restoring environment variables from backup..." -ForegroundColor Yellow
        
        # Create a backup of the current env file
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $currentEnvBackup = "$envProdFile.$timestamp.bak"
        Copy-Item -Path $envProdFile -Destination $currentEnvBackup -Force
        
        # Restore from backup
        Copy-Item -Path $envBackupFile -Destination $envProdFile -Force
        
        Write-Host "Environment variables restored successfully." -ForegroundColor Green
        Write-Host "Current environment file backed up to: $currentEnvBackup" -ForegroundColor Green
        return $true
    } else {
        Write-Host "No environment file backup found at: $envBackupFile" -ForegroundColor Red
        return $false
    }
}

# Function to backup current environment file
function Backup-EnvFile {
    if (Test-Path $envProdFile) {
        Write-Host "Backing up current environment variables..." -ForegroundColor Yellow
        
        # Create backup directory if it doesn't exist
        if (-not (Test-Path (Split-Path -Path $envBackupFile -Parent))) {
            New-Item -Path (Split-Path -Path $envBackupFile -Parent) -ItemType Directory -Force | Out-Null
        }
        
        # Create backup
        Copy-Item -Path $envProdFile -Destination $envBackupFile -Force
        
        Write-Host "Environment variables backed up successfully to: $envBackupFile" -ForegroundColor Green
        return $true
    } else {
        Write-Host "No environment file found at: $envProdFile" -ForegroundColor Red
        return $false
    }
}

# Function to restore database from backup
function Restore-Database {
    param(
        [string]$backupFile
    )
    
    if (-not (Test-Path $backupFile)) {
        Write-Host "Error: Backup file not found: $backupFile" -ForegroundColor Red
        return $false
    }
    
    Write-Host "Restoring database from backup: $backupFile" -ForegroundColor Yellow
    
    # Call backup.ps1 with restore parameter
    & ./backup.ps1 restore --backup-file $backupFile
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Database restoration failed." -ForegroundColor Red
        return $false
    }
    
    Write-Host "Database restored successfully." -ForegroundColor Green
    return $true
}

# Function to rollback code using Git
function Rollback-Code {
    param(
        [string]$commitId
    )
    
    Write-Host "Rolling back code to commit: $commitId" -ForegroundColor Yellow
    
    # Stash any current changes
    git stash -m "Auto-stashed before auth rollback"
    
    # Checkout the specific commit
    git checkout $commitId
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to roll back code to commit: $commitId" -ForegroundColor Red
        return $false
    }
    
    Write-Host "Code rolled back successfully to commit: $commitId" -ForegroundColor Green
    return $true
}

# Function to get recent commits
function Get-RecentCommits {
    Write-Host "Recent commits:" -ForegroundColor Yellow
    
    git log --oneline -n 10
    
    Write-Host ""
    return $true
}

# Main rollback process
try {
    # Display options
    Write-Host "Authentication Rollback Options:" -ForegroundColor Yellow
    Write-Host "  1. Restore environment variables only" -ForegroundColor White
    Write-Host "  2. Restore database from backup" -ForegroundColor White
    Write-Host "  3. Rollback code to previous commit" -ForegroundColor White
    Write-Host "  4. Full rollback (environment, database, and code)" -ForegroundColor White
    Write-Host "  5. Exit" -ForegroundColor White
    Write-Host ""
    
    $option = Read-Host "Select an option (1-5)"
    
    switch ($option) {
        "1" {
            # Backup current env file before restoring
            Backup-EnvFile | Out-Null
            
            # Restore environment variables
            if (Restore-EnvFile) {
                Write-Host "Environment variables rollback completed successfully." -ForegroundColor Green
            } else {
                Write-Host "Environment variables rollback failed." -ForegroundColor Red
            }
        }
        "2" {
            # List available backups
            if (List-Backups) {
                $backupIndex = Read-Host "Select a backup to restore (number)"
                
                $backups = Get-ChildItem -Path $backupDir -Filter "tf_backup_*.sql" | Sort-Object LastWriteTime -Descending
                
                if ([int]$backupIndex -le $backups.Count -and [int]$backupIndex -gt 0) {
                    $selectedBackup = $backups[[int]$backupIndex - 1].FullName
                    
                    if (Restore-Database -backupFile $selectedBackup) {
                        Write-Host "Database rollback completed successfully." -ForegroundColor Green
                    } else {
                        Write-Host "Database rollback failed." -ForegroundColor Red
                    }
                } else {
                    Write-Host "Invalid selection." -ForegroundColor Red
                }
            }
        }
        "3" {
            # Show recent commits
            Get-RecentCommits
            
            $commitId = Read-Host "Enter the commit ID to roll back to"
            
            if ($commitId) {
                if (Rollback-Code -commitId $commitId) {
                    Write-Host "Code rollback completed successfully." -ForegroundColor Green
                    Write-Host "Remember to rebuild the application:" -ForegroundColor Yellow
                    Write-Host "  npm install" -ForegroundColor White
                    Write-Host "  npm run build" -ForegroundColor White
                } else {
                    Write-Host "Code rollback failed." -ForegroundColor Red
                }
            } else {
                Write-Host "No commit ID provided." -ForegroundColor Red
            }
        }
        "4" {
            Write-Host "Performing full rollback..." -ForegroundColor Yellow
            
            # Backup current env file
            Backup-EnvFile | Out-Null
            
            # Restore environment variables
            $envRestored = Restore-EnvFile
            
            # List available backups
            if (List-Backups) {
                $backupIndex = Read-Host "Select a backup to restore (number)"
                
                $backups = Get-ChildItem -Path $backupDir -Filter "tf_backup_*.sql" | Sort-Object LastWriteTime -Descending
                
                if ([int]$backupIndex -le $backups.Count -and [int]$backupIndex -gt 0) {
                    $selectedBackup = $backups[[int]$backupIndex - 1].FullName
                    
                    # Restore database
                    $dbRestored = Restore-Database -backupFile $selectedBackup
                    
                    # Show recent commits
                    Get-RecentCommits
                    
                    $commitId = Read-Host "Enter the commit ID to roll back to"
                    
                    if ($commitId) {
                        # Roll back code
                        $codeRestored = Rollback-Code -commitId $commitId
                        
                        # Summary
                        Write-Host ""
                        Write-Host "Rollback Summary:" -ForegroundColor Cyan
                        Write-Host "  Environment variables: $($envRestored ? "SUCCESS" : "FAILED")" -ForegroundColor ($envRestored ? "Green" : "Red")
                        Write-Host "  Database: $($dbRestored ? "SUCCESS" : "FAILED")" -ForegroundColor ($dbRestored ? "Green" : "Red")
                        Write-Host "  Code: $($codeRestored ? "SUCCESS" : "FAILED")" -ForegroundColor ($codeRestored ? "Green" : "Red")
                        
                        if ($codeRestored) {
                            Write-Host ""
                            Write-Host "Remember to rebuild the application:" -ForegroundColor Yellow
                            Write-Host "  npm install" -ForegroundColor White
                            Write-Host "  npm run build" -ForegroundColor White
                        }
                    } else {
                        Write-Host "No commit ID provided, skipping code rollback." -ForegroundColor Red
                    }
                } else {
                    Write-Host "Invalid selection." -ForegroundColor Red
                }
            }
        }
        "5" {
            Write-Host "Exiting..." -ForegroundColor Yellow
            exit 0
        }
        default {
            Write-Host "Invalid option. Exiting..." -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "      Rollback Process Complete      " -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
} catch {
    Write-Host "Rollback failed with error: $_" -ForegroundColor Red
    exit 1
} 