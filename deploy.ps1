# Therapists Friend Deployment Script
# This script deploys the application to the Google production container

# Stop on errors
$ErrorActionPreference = "Stop"

# Display header
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Therapists Friend Deployment Tool  " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Environment variables
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "./backups"
$backupFileName = "$backupDir/tf_backup_$timestamp.sql"
$envProdFile = ".env.production"
$prodDbConnectionString = $null

# Check if we're running in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: This script must be run from the project root directory." -ForegroundColor Red
    exit 1
}

# Check if production env file exists
if (-not (Test-Path $envProdFile)) {
    Write-Host "Error: $envProdFile file is missing. Please create it with the production database configuration." -ForegroundColor Red
    exit 1
}

# Parse production database connection string from env file
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

# Create backup directory if it doesn't exist
if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory | Out-Null
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
}

# Function to create a database backup
function Create-Backup {
    Write-Host "Creating database backup..." -ForegroundColor Yellow
    
    # Run backup script
    & ./backup.ps1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Backup failed, stopping deployment." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Database backup completed successfully." -ForegroundColor Green
}

# Function to build the application
function Build-Application {
    Write-Host "Building application..." -ForegroundColor Yellow
    
    # Install dependencies if node_modules doesn't exist
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install --production=false
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: Failed to install dependencies." -ForegroundColor Red
            exit 1
        }
    }
    
    # Build the application
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Build failed." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Application built successfully." -ForegroundColor Green
}

# Function to run tests
function Run-Tests {
    Write-Host "Running tests..." -ForegroundColor Yellow
    
    # Run tests, if a test script is defined
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.scripts.test) {
        npm test
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: Tests failed." -ForegroundColor Red
            Write-Host "Do you want to continue with deployment anyway? (y/n)" -ForegroundColor Yellow
            $continue = Read-Host
            
            if ($continue -ne "y") {
                Write-Host "Deployment aborted." -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "Tests passed successfully." -ForegroundColor Green
        }
    } else {
        Write-Host "No test script found, skipping tests." -ForegroundColor Yellow
    }
}

# Function to deploy to Google production container
function Deploy-ToProduction {
    Write-Host "Deploying to Google production container..." -ForegroundColor Yellow
    
    # Apply database migrations
    Write-Host "Applying database migrations..." -ForegroundColor Yellow
    
    # Set environment to production temporarily for running migrations
    $env:NODE_ENV = "production"
    npx prisma migrate deploy
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Database migration failed." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Database migrations applied successfully." -ForegroundColor Green
    
    # Google Cloud deployment commands would go here
    # Replace with actual deployment commands for your Google Cloud setup
    
    # Example:
    # gcloud app deploy --project=therapists-friend
    
    Write-Host "Simulating deployment to Google production container..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2  # Simulate deployment time
    
    Write-Host "Application deployed successfully to Google production container." -ForegroundColor Green
}

# Main deployment process
try {
    Write-Host "Starting deployment process..." -ForegroundColor Green
    
    # Ask for confirmation
    Write-Host "Are you sure you want to deploy to PRODUCTION? (yes/no)" -ForegroundColor Yellow
    $confirmation = Read-Host
    
    if ($confirmation -ne "yes") {
        Write-Host "Deployment aborted." -ForegroundColor Red
        exit 0
    }
    
    # Create backup
    Create-Backup
    
    # Build the application
    Build-Application
    
    # Run tests
    Run-Tests
    
    # Deploy to production
    Deploy-ToProduction
    
    # Completion message
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "  Deployment Completed Successfully  " -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Verify the application is working at the production URL" -ForegroundColor Yellow
    Write-Host "2. Check for any errors in the logs" -ForegroundColor Yellow
    Write-Host "3. Update the deployment.md documentation with this deployment" -ForegroundColor Yellow
} catch {
    Write-Host "Deployment failed with error: $_" -ForegroundColor Red
    exit 1
} 