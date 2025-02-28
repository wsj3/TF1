# Therapists Friend Backup Script
# This script creates and manages backups of the Therapists Friend database

# Stop on errors
$ErrorActionPreference = "Stop"

# Display header
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Therapists Friend Backup Tool  " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$backupDir = "./backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFileName = "$backupDir/tf_backup_$timestamp.sql"
$envProdFile = ".env.production"
$prodDbConnectionString = $null
$maxBackups = 10  # Maximum number of backups to keep

# Check if .env.production exists
if (-not (Test-Path $envProdFile)) {
    # Try to use .env.local instead
    $envProdFile = ".env.local"
    
    if (-not (Test-Path $envProdFile)) {
        Write-Host "Error: Neither .env.production nor .env.local found. Cannot determine database connection." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Warning: Using .env.local instead of .env.production" -ForegroundColor Yellow
}

# Parse database connection string from env file
$envContent = Get-Content $envProdFile
foreach ($line in $envContent) {
    if ($line -match "DATABASE_URL=") {
        $prodDbConnectionString = $line -replace "DATABASE_URL=", "" -replace '"', ""
        break
    }
}

if (-not $prodDbConnectionString) {
    Write-Host "Error: Could not find DATABASE_URL in $envProdFile" -ForegroundColor Red
    exit 1
}

# Extract database information from connection string
$dbUser = ""
$dbPassword = ""
$dbHost = ""
$dbPort = "5432"  # Default PostgreSQL port
$dbName = ""

# Parse connection string (format: postgresql://username:password@hostname:port/database)
if ($prodDbConnectionString -match "postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)") {
    $dbUser = $Matches[1]
    $dbPassword = $Matches[2]
    $dbHost = $Matches[3]
    $dbPort = $Matches[4]
    $dbName = $Matches[5]
} elseif ($prodDbConnectionString -match "postgresql://([^:]+):([^@]+)@([^/]+)/(.+)") {
    # Format without explicit port
    $dbUser = $Matches[1]
    $dbPassword = $Matches[2]
    $dbHost = $Matches[3]
    $dbName = $Matches[4]
} else {
    Write-Host "Error: Could not parse database connection string." -ForegroundColor Red
    exit 1
}

# Create backup directory if it doesn't exist
if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory | Out-Null
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
}

# Function to create a database backup
function Create-Backup {
    Write-Host "Creating database backup to $backupFileName..." -ForegroundColor Yellow
    
    # Set PGPASSWORD environment variable for pg_dump
    $env:PGPASSWORD = $dbPassword
    
    try {
        # Use pg_dump to create a backup
        pg_dump -h $dbHost -p $dbPort -U $dbUser -d $dbName -F p -f $backupFileName
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: Failed to create database backup." -ForegroundColor Red
            return $false
        }
        
        Write-Host "Backup created successfully: $backupFileName" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Error during backup: $_" -ForegroundColor Red
        return $false
    } finally {
        # Clear PGPASSWORD environment variable
        Remove-Item Env:\PGPASSWORD
    }
}

# Function to restore a database from backup
function Restore-Backup {
    param (
        [string]$backupFile
    )
    
    if (-not (Test-Path $backupFile)) {
        Write-Host "Error: Backup file not found: $backupFile" -ForegroundColor Red
        return $false
    }
    
    Write-Host "Restoring database from $backupFile..." -ForegroundColor Yellow
    
    # Set PGPASSWORD environment variable for psql
    $env:PGPASSWORD = $dbPassword
    
    try {
        # First, drop the existing database
        Write-Host "Dropping existing database..." -ForegroundColor Yellow
        
        # Connect to postgres database to drop and recreate our target database
        psql -h $dbHost -p $dbPort -U $dbUser -d "postgres" -c "DROP DATABASE IF EXISTS $dbName WITH (FORCE);"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: Failed to drop existing database." -ForegroundColor Red
            return $false
        }
        
        # Recreate the database
        Write-Host "Creating new database..." -ForegroundColor Yellow
        psql -h $dbHost -p $dbPort -U $dbUser -d "postgres" -c "CREATE DATABASE $dbName;"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: Failed to create new database." -ForegroundColor Red
            return $false
        }
        
        # Restore from backup
        Write-Host "Restoring database content..." -ForegroundColor Yellow
        psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $backupFile
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: Failed to restore database." -ForegroundColor Red
            return $false
        }
        
        Write-Host "Database restored successfully from: $backupFile" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Error during restore: $_" -ForegroundColor Red
        return $false
    } finally {
        # Clear PGPASSWORD environment variable
        Remove-Item Env:\PGPASSWORD
    }
}

# Function to list all available backups
function List-Backups {
    Write-Host "Available backups:" -ForegroundColor Yellow
    
    $backups = Get-ChildItem -Path $backupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending
    
    if ($backups.Count -eq 0) {
        Write-Host "No backups found in $backupDir" -ForegroundColor Yellow
        return
    }
    
    foreach ($backup in $backups) {
        $fileSize = "{0:N2} MB" -f ($backup.Length / 1MB)
        $timestamp = $backup.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        Write-Host "$($backup.Name) - $fileSize - Created: $timestamp" -ForegroundColor Green
    }
}

# Function to clean up old backups
function Cleanup-Backups {
    $backups = Get-ChildItem -Path $backupDir -Filter "*.sql" | Sort-Object LastWriteTime
    
    if ($backups.Count -le $maxBackups) {
        return  # No need to clean up
    }
    
    $toDelete = $backups.Count - $maxBackups
    Write-Host "Cleaning up $toDelete old backup(s)..." -ForegroundColor Yellow
    
    $backups | Select-Object -First $toDelete | ForEach-Object {
        Remove-Item $_.FullName
        Write-Host "Removed old backup: $($_.Name)" -ForegroundColor Green
    }
}

# Parse command line arguments
$command = $args[0]

if (-not $command -or $command -eq "backup") {
    # Create a new backup
    $success = Create-Backup
    
    if ($success) {
        # Clean up old backups
        Cleanup-Backups
    } else {
        exit 1
    }
} elseif ($command -eq "list") {
    # List available backups
    List-Backups
} elseif ($command -eq "restore") {
    # Restore from a backup
    $backupFile = $args | Where-Object { $_ -match "--backup-file=" } | ForEach-Object { $_ -replace "--backup-file=", "" }
    
    if (-not $backupFile) {
        # No specific backup file specified, list available backups and prompt user
        List-Backups
        
        Write-Host ""
        Write-Host "Enter the name of the backup file to restore:" -ForegroundColor Yellow
        $backupFileName = Read-Host
        
        if (-not $backupFileName) {
            Write-Host "Restore cancelled." -ForegroundColor Red
            exit 0
        }
        
        $backupFile = "$backupDir/$backupFileName"
    }
    
    # Confirm before restoring
    Write-Host "WARNING: This will OVERWRITE the current database with the backup." -ForegroundColor Red
    Write-Host "Are you sure you want to continue? (yes/no)" -ForegroundColor Yellow
    $confirmation = Read-Host
    
    if ($confirmation -ne "yes") {
        Write-Host "Restore cancelled." -ForegroundColor Red
        exit 0
    }
    
    $success = Restore-Backup -backupFile $backupFile
    
    if (-not $success) {
        exit 1
    }
} else {
    # Unknown command
    Write-Host "Unknown command: $command" -ForegroundColor Red
    Write-Host "Available commands: backup (default), list, restore" -ForegroundColor Yellow
    exit 1
} 