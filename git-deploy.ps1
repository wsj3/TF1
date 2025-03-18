# Git-based Deployment Script for Therapists Friend
# This script pushes local code to git, which Digital Ocean will then pull from
# Repository: https://github.com/wsj3/tf1

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Git-based Staging Deployment Tool  " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check current branch
Write-Host "Checking current git branch..." -ForegroundColor Yellow
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Currently on branch: $currentBranch" -ForegroundColor Green

# Display repository information
Write-Host "Repository: https://github.com/wsj3/tf1" -ForegroundColor Green
Write-Host "Target branch for staging: staging" -ForegroundColor Green
Write-Host "Target branch for production: main" -ForegroundColor Green
Write-Host ""

# Ask for confirmation
Write-Host "This will deploy your LOCAL changes to the Git repository." -ForegroundColor Yellow
Write-Host "Digital Ocean will then automatically deploy to staging." -ForegroundColor Yellow
Write-Host "Do you want to continue? (yes/no)" -ForegroundColor Yellow
$confirmation = Read-Host

if ($confirmation -ne "yes") {
    Write-Host "Deployment aborted." -ForegroundColor Red
    exit 0
}

# First, pull latest changes to avoid conflicts
Write-Host "Fetching latest changes from remote..." -ForegroundColor Yellow
git fetch

# Check if we need to pull
$behindCount = git rev-list --count HEAD..origin/$currentBranch
if ($behindCount -gt 0) {
    Write-Host "Your branch is behind the remote by $behindCount commits." -ForegroundColor Yellow
    Write-Host "Pulling latest changes..." -ForegroundColor Yellow
    git pull
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to pull latest changes. Please resolve conflicts manually." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Successfully pulled latest changes." -ForegroundColor Green
}

# Check for the nul file which is causing issues
if (Test-Path nul) {
    Write-Host "Removing problematic 'nul' file..." -ForegroundColor Yellow
    Remove-Item nul
    Write-Host "Removed 'nul' file." -ForegroundColor Green
}

# Handle embedded git repositories in backups
Write-Host "Checking for embedded git repositories..." -ForegroundColor Yellow
$embeddedRepos = git ls-files --error-unmatch backups/*/\.git 2>$null
if ($embeddedRepos) {
    Write-Host "Found embedded git repositories in backups. These should be removed before committing." -ForegroundColor Yellow
    Write-Host "Do you want to remove the entire backups folder from git tracking? (yes/no)" -ForegroundColor Yellow
    $removeBackups = Read-Host
    
    if ($removeBackups -eq "yes") {
        git rm -r --cached backups/
        Write-Host "Removed backups folder from git tracking." -ForegroundColor Green
        
        # Make sure backups folder is in gitignore
        $gitignore = Get-Content .gitignore -ErrorAction SilentlyContinue
        if (-not ($gitignore -contains "backups/")) {
            Write-Host "Adding backups/ to .gitignore..." -ForegroundColor Yellow
            Add-Content .gitignore "`nbackups/"
            Write-Host "Added backups/ to .gitignore." -ForegroundColor Green
        }
    } else {
        Write-Host "Please manually resolve the embedded git repositories issue before deploying." -ForegroundColor Red
        exit 1
    }
}

# Show changes to be committed
Write-Host "Files to be committed:" -ForegroundColor Yellow
git status

# Commit changes
Write-Host "Do you want to commit these changes? (yes/no)" -ForegroundColor Yellow
$doCommit = Read-Host

if ($doCommit -eq "yes") {
    Write-Host "Enter commit message (default: 'Deploy to staging'):" -ForegroundColor Yellow
    $commitMessage = Read-Host
    
    if (-not $commitMessage) {
        $commitMessage = "Deploy to staging $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    
    # Add all changes
    Write-Host "Adding changes..." -ForegroundColor Yellow
    git add --all
    
    # Commit
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to commit changes." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Changes committed successfully." -ForegroundColor Green
    
    # Push to remote
    Write-Host "Pushing to remote..." -ForegroundColor Yellow
    git push origin $currentBranch
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to push changes. The remote might have new changes." -ForegroundColor Red
        Write-Host "Try pulling changes first with 'git pull' and then run this script again." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Successfully pushed to remote." -ForegroundColor Green
    
    # Completion message
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "  Git-based Deployment Complete!  " -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your code has been successfully pushed to the git repository." -ForegroundColor Green
    Write-Host "Digital Ocean should now automatically deploy the changes." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Check Digital Ocean dashboard for deployment status" -ForegroundColor Yellow
    Write-Host "2. Verify the application at https://staging.therapistsfriend.com" -ForegroundColor Yellow
    Write-Host "3. Test all features to ensure they work correctly" -ForegroundColor Yellow
} else {
    Write-Host "Deployment cancelled." -ForegroundColor Red
} 