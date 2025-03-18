# Fresh Git Deployment Script
# This script creates a fresh staging branch and pushes all code for a clean deployment

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Fresh Git Deployment to Staging   " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Ask for confirmation
Write-Host "This will create a fresh staging branch and push all local code." -ForegroundColor Yellow
Write-Host "Are you sure you want to proceed? (yes/no)" -ForegroundColor Yellow
$confirmation = Read-Host

if ($confirmation -ne "yes") {
    Write-Host "Fresh deployment aborted." -ForegroundColor Red
    exit 0
}

# Check if staging branch exists locally
$stagingExists = git show-ref --verify --quiet refs/heads/staging
$stagingExistsInRemote = git ls-remote --exit-code origin staging

# Backup current work if needed
Write-Host "Do you want to backup your current branch first? (yes/no)" -ForegroundColor Yellow
$backupBranch = Read-Host

if ($backupBranch -eq "yes") {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupBranchName = "backup_$timestamp"
    
    Write-Host "Creating backup branch: $backupBranchName..." -ForegroundColor Yellow
    git branch $backupBranchName
    Write-Host "Backup created as branch: $backupBranchName" -ForegroundColor Green
}

# Create fresh staging branch
Write-Host "Creating fresh staging branch..." -ForegroundColor Yellow

# Save current branch name
$currentBranch = git branch --show-current

# Create and checkout a clean staging branch from main/master
Write-Host "Fetching latest main branch..." -ForegroundColor Yellow
git fetch origin main

# Check if main exists, otherwise try master
$mainExists = git show-ref --verify --quiet refs/remotes/origin/main
if ($mainExists -eq $true) {
    $baseBranch = "main"
} else {
    $baseBranch = "master"
    Write-Host "Using $baseBranch as the base branch" -ForegroundColor Yellow
}

# Delete existing staging branch if it exists
if ($stagingExists -eq $true) {
    Write-Host "Removing existing local staging branch..." -ForegroundColor Yellow
    git branch -D staging
}

# Create a new staging branch based on origin/main or origin/master
Write-Host "Creating fresh staging branch from origin/$baseBranch..." -ForegroundColor Yellow
git checkout -b staging origin/$baseBranch

# Add all files from the current directory
Write-Host "Adding all files to staging branch..." -ForegroundColor Yellow
git add .

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "Fresh deployment to staging - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Force push to origin staging
Write-Host "Force pushing to origin staging..." -ForegroundColor Yellow
git push -f origin staging

Write-Host "====================================" -ForegroundColor Green
Write-Host "  Fresh Git Deployment Completed!   " -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify your deployment on the staging environment" -ForegroundColor Yellow
Write-Host "2. After verification, you can use git-deploy.ps1 for incremental updates" -ForegroundColor Yellow 