# Therapists Friend - Promote Staging to Production Script
# This script helps automate the process of promoting staging changes to production
# Repository: https://github.com/wsj3/tf1

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Staging to Production Promotion Tool  " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "DIGITAL OCEAN DEPLOYMENT WORKFLOW" -ForegroundColor Yellow
Write-Host "This tool helps you verify staging is ready for promotion to production." -ForegroundColor Yellow
Write-Host "After verification, you'll need to manually trigger the production deployment in DigitalOcean." -ForegroundColor Yellow
Write-Host ""

# Check current branch
Write-Host "Checking current git branch..." -ForegroundColor Yellow
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Currently on branch: $currentBranch" -ForegroundColor Green

if ($currentBranch -ne "staging") {
    Write-Host "You are not on the staging branch." -ForegroundColor Yellow
    Write-Host "Do you want to switch to the staging branch? (yes/no)" -ForegroundColor Yellow
    $switchBranch = Read-Host

    if ($switchBranch -eq "yes") {
        # Check if there are uncommitted changes
        $status = git status --porcelain
        if ($status) {
            Write-Host "You have uncommitted changes. Please commit or stash them before switching branches." -ForegroundColor Red
            exit 1
        }

        # Switch to staging branch
        git checkout staging
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to switch to staging branch." -ForegroundColor Red
            exit 1
        }

        Write-Host "Successfully switched to staging branch." -ForegroundColor Green
    } else {
        Write-Host "Promotion process should start from the staging branch." -ForegroundColor Yellow
        Write-Host "Do you want to continue anyway? (yes/no)" -ForegroundColor Yellow
        $continueDespiteBranch = Read-Host

        if ($continueDespiteBranch -ne "yes") {
            Write-Host "Promotion aborted." -ForegroundColor Red
            exit 0
        }
    }
}

# Pull latest changes
Write-Host "Pulling latest changes from staging..." -ForegroundColor Yellow
git pull origin staging
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to pull latest changes. Please resolve conflicts manually." -ForegroundColor Red
    exit 1
}
Write-Host "Successfully pulled latest changes." -ForegroundColor Green

# Show changes that will be promoted
Write-Host "Fetching production branch..." -ForegroundColor Yellow
git fetch origin main
Write-Host "Checking differences between staging and production..." -ForegroundColor Yellow

# Commits ahead
$aheadCount = git rev-list --count origin/main..staging
if ($aheadCount -eq 0) {
    Write-Host "Staging is not ahead of production. There are no changes to promote." -ForegroundColor Yellow
    Write-Host "Do you want to continue anyway? (yes/no)" -ForegroundColor Yellow
    $continueNoChanges = Read-Host

    if ($continueNoChanges -ne "yes") {
        Write-Host "Promotion aborted." -ForegroundColor Red
        exit 0
    }
} else {
    Write-Host "Staging is ahead of production by $aheadCount commits." -ForegroundColor Green
}

# Show changes between staging and production
Write-Host "Commits to be promoted to production:" -ForegroundColor Yellow
git log --oneline origin/main..staging

# Display files changed
Write-Host "Files changed:" -ForegroundColor Yellow
git diff --name-status origin/main..staging

# Pre-launch checklist
Write-Host "==== Pre-Promotion Checklist ====" -ForegroundColor Cyan
Write-Host "Please check the following before promoting to production:" -ForegroundColor Yellow
Write-Host "1. Has the staging environment been thoroughly tested? (yes/no)" -ForegroundColor Yellow
$testingComplete = Read-Host

if ($testingComplete -ne "yes") {
    Write-Host "Please complete testing on staging before promoting to production." -ForegroundColor Red
    exit 0
}

Write-Host "2. Are all necessary approvals in place? (yes/no)" -ForegroundColor Yellow
$approvalsComplete = Read-Host

if ($approvalsComplete -ne "yes") {
    Write-Host "Please obtain the necessary approvals before promoting to production." -ForegroundColor Red
    exit 0
}

# Confirm deployment
Write-Host "Ready to initiate production deployment via DigitalOcean." -ForegroundColor Green
Write-Host "This will promote all staging changes to production." -ForegroundColor Yellow
Write-Host "Do you want to continue? (yes/no)" -ForegroundColor Yellow
$confirmDeploy = Read-Host

if ($confirmDeploy -eq "yes") {
    # Since DigitalOcean requires manual deployment to production
    
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "  Production Deployment Instructions  " -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Staging is ready for promotion to production!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To complete the production deployment:" -ForegroundColor Yellow
    Write-Host "1. Log in to DigitalOcean App Platform: https://cloud.digitalocean.com/apps" -ForegroundColor Yellow
    Write-Host "2. Navigate to your production app (tf1-production)" -ForegroundColor Yellow
    Write-Host "3. Click the 'Deploy' button to manually trigger a new deployment" -ForegroundColor Yellow
    Write-Host "4. Monitor the deployment logs for any issues" -ForegroundColor Yellow
    Write-Host "5. Verify the production environment after deployment completes" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Would you like to open the DigitalOcean dashboard in your browser? (yes/no)" -ForegroundColor Yellow
    $openBrowser = Read-Host
    
    if ($openBrowser -eq "yes") {
        Start-Process "https://cloud.digitalocean.com/apps"
    }
} else {
    Write-Host "Promotion process aborted." -ForegroundColor Red
} 