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

# Run post-deployment commands on the server
Write-Host "Finalizing deployment on staging server..." -ForegroundColor Yellow

$finalizeCommands = @"
cd $doPath
npm install --production
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
Write-Host "" 