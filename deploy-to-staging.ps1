# Therapists Friend Staging Deployment Script
# This script deploys the current local development application to Digital Ocean staging environment

# Stop on errors
$ErrorActionPreference = "Stop"

# Display header
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Therapists Friend Staging Deploy  " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Environment variables
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "./backups"
$backupFileName = "$backupDir/staging_backup_$timestamp.sql"
$envFile = ".env.staging.local"
$dbConnectionString = $null

# Check if we're running in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: This script must be run from the project root directory." -ForegroundColor Red
    exit 1
}

# Create backup directory if it doesn't exist
if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory | Out-Null
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
}

# Function to create a backup of the current staging environment
function Create-Staging-Backup {
    Write-Host "Creating staging environment backup..." -ForegroundColor Yellow
    
    # Ask if backup is needed
    Write-Host "Do you want to create a backup before deployment? (yes/no)" -ForegroundColor Yellow
    $createBackup = Read-Host
    
    if ($createBackup -ne "yes") {
        Write-Host "Skipping backup process." -ForegroundColor Yellow
        return $true
    }
    
    # Run backup script
    & ./backup.ps1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Backup failed." -ForegroundColor Red
        Write-Host "Do you want to continue with deployment anyway? (yes/no)" -ForegroundColor Yellow
        $continueDeployment = Read-Host
        
        if ($continueDeployment -ne "yes") {
            Write-Host "Deployment aborted." -ForegroundColor Red
            exit 1
        }
        
        Write-Host "Continuing deployment without backup." -ForegroundColor Yellow
        return $true
    }
    
    Write-Host "Staging environment backup completed successfully." -ForegroundColor Green
    return $true
}

# Function to build the application
function Build-Application {
    Write-Host "Building application for staging..." -ForegroundColor Yellow
    
    # Install dependencies if node_modules doesn't exist
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install --production=false
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: Failed to install dependencies." -ForegroundColor Red
            exit 1
        }
    }
    
    # Set the environment for the build
    $env:NODE_ENV = "production"
    
    # Build the application
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Build failed." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Application built successfully for staging." -ForegroundColor Green
}

# Function to deploy to Digital Ocean staging
function Deploy-To-Staging {
    Write-Host "Deploying to Digital Ocean staging environment..." -ForegroundColor Yellow
    
    # Define the SSH credentials for Digital Ocean droplet
    $doHost = "staging.therapistsfriend.com"
    $doUser = "root"
    $doPath = "/var/www/therapistsfriend"
    
    # Create the deployment package
    Write-Host "Creating deployment package..." -ForegroundColor Yellow
    $deployPackage = "staging_deployment_$timestamp.zip"
    
    # Create a zip file excluding development files
    if (Test-Path $deployPackage) {
        Remove-Item $deployPackage
    }
    
    # Use PowerShell's Compress-Archive cmdlet instead of tar
    # First, create a list of files to include (excluding node_modules, .git, and backups)
    $files = Get-ChildItem -Path . -Exclude "node_modules", ".git", "backups" -Recurse | 
        Where-Object { !$_.FullName.Contains("node_modules") -and !$_.FullName.Contains(".git") -and !$_.FullName.Contains("backups") }
    
    try {
        # Compress the files
        Compress-Archive -Path $files -DestinationPath $deployPackage -Force
        
        if (-not (Test-Path $deployPackage)) {
            Write-Host "Error: Failed to create deployment package." -ForegroundColor Red
            exit 1
        }
        
        Write-Host "Deployment package created successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "Error creating deployment package: $_" -ForegroundColor Red
        exit 1
    }
    
    # Copy the deployment package to the Digital Ocean droplet
    Write-Host "Copying deployment package to $doHost..." -ForegroundColor Yellow
    scp $deployPackage "${doUser}@${doHost}:/tmp/$deployPackage"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to copy deployment package to Digital Ocean." -ForegroundColor Red
        Remove-Item $deployPackage
        exit 1
    }
    
    # Execute deployment commands on the Digital Ocean droplet
    Write-Host "Deploying application on $doHost..." -ForegroundColor Yellow
    
    $deployCommands = @"
mkdir -p $doPath
cd $doPath
apt-get update && apt-get install -y unzip
unzip -o /tmp/$deployPackage -d $doPath
npm install --production
npm run build
pm2 restart therapistsfriend || pm2 start npm --name therapistsfriend -- start
rm /tmp/$deployPackage
"@
    
    $deployCommands | ssh "${doUser}@${doHost}" "bash -s"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Deployment failed on Digital Ocean droplet." -ForegroundColor Red
        Remove-Item $deployPackage
        exit 1
    }
    
    # Clean up local deployment package
    Remove-Item $deployPackage
    
    Write-Host "Application deployed successfully to Digital Ocean staging environment." -ForegroundColor Green
}

# Main deployment process
try {
    Write-Host "Starting deployment process to staging environment..." -ForegroundColor Green
    
    # Ask for confirmation
    Write-Host "Are you sure you want to deploy the current LOCAL development application to STAGING? (yes/no)" -ForegroundColor Yellow
    $confirmation = Read-Host
    
    if ($confirmation -ne "yes") {
        Write-Host "Deployment aborted." -ForegroundColor Red
        exit 0
    }
    
    # Create backup (optional now)
    Create-Staging-Backup
    
    # Build the application
    Build-Application
    
    # Deploy to Digital Ocean staging
    Deploy-To-Staging
    
    # Completion message
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "  Staging Deployment Completed!  " -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Verify the application is working at https://staging.therapistsfriend.com" -ForegroundColor Yellow
    Write-Host "2. Check for any errors in the logs" -ForegroundColor Yellow
    Write-Host "3. Test authentication flows to ensure users can log in" -ForegroundColor Yellow
    Write-Host "4. Verify all features are working as expected" -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host "Deployment failed with error: $_" -ForegroundColor Red
    exit 1
} 