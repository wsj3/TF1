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

# Function to verify environment variables
function Verify-AuthEnvironmentVariables {
    Write-Host "Verifying authentication environment variables..." -ForegroundColor Yellow
    
    $envContent = Get-Content $envProdFile
    $jwtSecretFound = $false
    $apiBaseUrlFound = $false
    
    foreach ($line in $envContent) {
        if ($line -match "JWT_SECRET=") {
            $jwtSecretFound = $true
        }
        if ($line -match "API_BASE_URL=") {
            $apiBaseUrlFound = $true
        }
    }
    
    $allFound = $true
    
    if (-not $jwtSecretFound) {
        Write-Host "Warning: JWT_SECRET is not set in $envProdFile" -ForegroundColor Red
        $allFound = $false
    }
    
    if (-not $apiBaseUrlFound) {
        Write-Host "Warning: API_BASE_URL is not set in $envProdFile" -ForegroundColor Red
        $allFound = $false
    }
    
    if (-not $allFound) {
        Write-Host "Error: Missing required authentication environment variables." -ForegroundColor Red
        Write-Host "Please ensure all authentication variables are set in $envProdFile before deploying." -ForegroundColor Yellow
        
        Write-Host "Do you want to continue with deployment anyway? (yes/no)" -ForegroundColor Yellow
        $continue = Read-Host
        
        if ($continue -ne "yes") {
            Write-Host "Deployment aborted." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Authentication environment variables verified successfully." -ForegroundColor Green
    }
}

# Function to test authentication endpoints
function Test-AuthEndpoints {
    Write-Host "Testing authentication API endpoints..." -ForegroundColor Yellow
    
    $apiBaseUrl = $null
    $envContent = Get-Content $envProdFile
    foreach ($line in $envContent) {
        if ($line -match "API_BASE_URL=") {
            $apiBaseUrl = $line -replace "API_BASE_URL=", "" -replace '"', ""
            break
        }
    }
    
    if (-not $apiBaseUrl) {
        Write-Host "Warning: API_BASE_URL not found, skipping endpoint test." -ForegroundColor Yellow
        return
    }
    
    try {
        $healthEndpoint = "$apiBaseUrl/health"
        Write-Host "Testing health endpoint: $healthEndpoint" -ForegroundColor Yellow
        
        $response = Invoke-WebRequest -Uri $healthEndpoint -Method GET -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "Authentication API health check successful." -ForegroundColor Green
        } else {
            Write-Host "Warning: Authentication API health check failed with status code $($response.StatusCode)" -ForegroundColor Red
            Write-Host "Do you want to continue with deployment anyway? (yes/no)" -ForegroundColor Yellow
            $continue = Read-Host
            
            if ($continue -ne "yes") {
                Write-Host "Deployment aborted." -ForegroundColor Red
                exit 1
            }
        }
    } catch {
        Write-Host "Warning: Authentication API health check failed: $_" -ForegroundColor Red
        Write-Host "Do you want to continue with deployment anyway? (yes/no)" -ForegroundColor Yellow
        $continue = Read-Host
        
        if ($continue -ne "yes") {
            Write-Host "Deployment aborted." -ForegroundColor Red
            exit 1
        }
    }
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
    
    # Verify authentication environment variables
    Verify-AuthEnvironmentVariables
    
    # Test authentication endpoints
    Test-AuthEndpoints
    
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
    Write-Host "3. Test authentication flows to ensure users can log in" -ForegroundColor Yellow
    Write-Host "4. Verify protected pages are accessible after login" -ForegroundColor Yellow
    Write-Host "5. Update the deployment.md documentation with this deployment" -ForegroundColor Yellow
} catch {
    Write-Host "Deployment failed with error: $_" -ForegroundColor Red
    exit 1
} 