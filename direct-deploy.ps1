# Therapists Friend Direct Staging Deployment Script
# This script deploys the current local development application to Digital Ocean staging environment

# Display header
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Direct Staging Deployment Tool  " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Define the SSH credentials for Digital Ocean droplet
$doHost = "staging.therapistsfriend.com"
$doUser = "root"
$doPath = "/var/www/therapistsfriend"

# Ask for confirmation
Write-Host "This script will deploy your LOCAL development application directly to STAGING." -ForegroundColor Yellow
Write-Host "Are you sure you want to continue? (yes/no)" -ForegroundColor Yellow
$confirmation = Read-Host

if ($confirmation -ne "yes") {
    Write-Host "Deployment aborted." -ForegroundColor Red
    exit 0
}

# Ask about database migrations
Write-Host ""
Write-Host "Do you want to run database migrations? (yes/no)" -ForegroundColor Yellow
$runMigrations = Read-Host

# Run Prisma DB migrations if selected
if ($runMigrations -eq "yes") {
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    
    # Generate Prisma client
    Write-Host "Generating Prisma client..." -ForegroundColor Yellow
    npx prisma generate
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to generate Prisma client." -ForegroundColor Red
        exit 1
    }
    
    # Ask for the staging database URL or use the one from .env.production
    Write-Host "Enter the staging database URL (leave empty to use the one from .env.production):" -ForegroundColor Yellow
    $dbUrl = Read-Host
    
    if ($dbUrl -eq "") {
        # Extract the DATABASE_URL from .env.production
        $envContent = Get-Content ".env.production" -ErrorAction SilentlyContinue
        $dbUrlLine = $envContent | Where-Object { $_ -match "DATABASE_URL" } | Select-Object -First 1
        
        if ($dbUrlLine) {
            $dbUrl = $dbUrlLine -replace "DATABASE_URL=", "" -replace '"', ''
            Write-Host "Using database URL from .env.production" -ForegroundColor Yellow
        } else {
            Write-Host "Error: Could not find DATABASE_URL in .env.production" -ForegroundColor Red
            exit 1
        }
    }
    
    # Set the environment variable for Prisma
    $env:DATABASE_URL = $dbUrl
    
    # Run the migrations
    Write-Host "Deploying database migrations..." -ForegroundColor Yellow
    npx prisma migrate deploy
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to deploy migrations." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Database migrations completed successfully." -ForegroundColor Green
    
    # Reset the environment variable
    $env:DATABASE_URL = $null
}

# Build the application locally
Write-Host "Building application for staging..." -ForegroundColor Yellow

# Set environment for build
$env:NODE_ENV = "production"
    
# Build the application
npm run build
    
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed." -ForegroundColor Red
    exit 1
}
    
Write-Host "Application built successfully for staging." -ForegroundColor Green

# Deploy using SSH and SCP directly
Write-Host "Setting up deployment on staging server..." -ForegroundColor Yellow

# Create a script to run on the remote server to prepare the environment
$setupCommands = @"
mkdir -p $doPath
echo 'Server environment prepared successfully'
"@

$setupCommands | ssh "${doUser}@${doHost}" "bash -s"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to set up staging environment." -ForegroundColor Red
    exit 1
}

# Use SCP to copy files directly to the server
Write-Host "Deploying application files to staging server..." -ForegroundColor Yellow

# First, copy the package.json and package-lock.json
scp package.json "${doUser}@${doHost}:${doPath}/"
scp package-lock.json "${doUser}@${doHost}:${doPath}/"

# Copy the .next build directory
scp -r .next "${doUser}@${doHost}:${doPath}/"

# Copy source files (pages, components, utils, styles, public)
scp -r pages "${doUser}@${doHost}:${doPath}/"
scp -r components "${doUser}@${doHost}:${doPath}/"
scp -r utils "${doUser}@${doHost}:${doPath}/"
scp -r styles "${doUser}@${doHost}:${doPath}/"
scp -r public "${doUser}@${doHost}:${doPath}/"

# Copy configuration files
scp next.config.js "${doUser}@${doHost}:${doPath}/"
scp .env.production "${doUser}@${doHost}:${doPath}/.env.local"

# Copy Prisma files
scp -r prisma "${doUser}@${doHost}:${doPath}/"

# Run post-deployment commands on the server
Write-Host "Finalizing deployment on staging server..." -ForegroundColor Yellow

$finalizeCommands = @"
cd $doPath
npm install --production
npm install @prisma/client
npx prisma generate
pm2 restart therapistsfriend || pm2 start npm --name therapistsfriend -- start
echo 'Deployment completed successfully!'
"@

$finalizeCommands | ssh "${doUser}@${doHost}" "bash -s"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to finalize deployment." -ForegroundColor Red
    exit 1
}

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
Write-Host "5. Test database functionality to ensure data is being stored correctly" -ForegroundColor Yellow
Write-Host "" 