# Check Assets Script for Therapist's Friend
# This script checks if the necessary asset files are present on the server

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Asset Verification Tool  " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Define the SSH credentials for Digital Ocean droplet
$doHost = "staging.therapistsfriend.com"
$doUser = "root"
$doPath = "/var/www/therapistsfriend"

# Ask for confirmation
Write-Host "This script will check for asset files on the STAGING server." -ForegroundColor Yellow
Write-Host "Do you want to continue? (yes/no)" -ForegroundColor Yellow
$confirmation = Read-Host

if ($confirmation -ne "yes") {
    Write-Host "Operation aborted." -ForegroundColor Red
    exit 0
}

# Run commands to check for public assets
Write-Host "Checking for asset files on the server..." -ForegroundColor Yellow

$checkCommands = @"
echo "===== Checking directory structure ====="
ls -la $doPath
echo ""
echo "===== Checking public directory ====="
ls -la $doPath/public
echo ""
echo "===== Checking if logo file exists ====="
if [ -f "$doPath/public/logo.png" ]; then
    echo "Logo file exists. Size:"
    du -h $doPath/public/logo.png
else
    echo "Logo file does not exist!"
fi
echo ""
echo "===== Checking .next directory ====="
ls -la $doPath/.next | head -n 10
echo "..."
echo ""
echo "===== Checking environment variables ====="
grep -v "DB_" $doPath/.env.local | grep -v "SECRET"
"@

$checkCommands | ssh "${doUser}@${doHost}" "bash -s"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to check assets on the server." -ForegroundColor Red
    exit 1
}

# Completion message
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Asset Verification Complete!  " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan 