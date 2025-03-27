# Therapists Friend - Promote Staging to Production Script
# This script helps automate the process of promoting staging to production
# Repository: https://github.com/wsj3/tf1

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Staging to Production Promotion Tool  " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if gh CLI is installed
$ghInstalled = $null
try {
    $ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
} catch {
    # Not installed
}

if (-not $ghInstalled) {
    Write-Host "GitHub CLI (gh) is not installed or not in PATH." -ForegroundColor Yellow
    Write-Host "For full automation of PR creation, please install GitHub CLI:" -ForegroundColor Yellow
    Write-Host "https://cli.github.com/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Will continue without automated PR creation." -ForegroundColor Yellow
    Write-Host ""
}

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

# Verify that staging is ahead of main
Write-Host "Checking if staging is ahead of main..." -ForegroundColor Yellow
git fetch origin main
$behindCount = git rev-list --count staging..origin/main
$aheadCount = git rev-list --count origin/main..staging

if ($behindCount -gt 0) {
    Write-Host "Warning: Staging is behind main by $behindCount commits." -ForegroundColor Red
    Write-Host "This may indicate that hotfixes were applied directly to main." -ForegroundColor Yellow
    Write-Host "Consider merging main into staging first: 'git merge origin/main'" -ForegroundColor Yellow
    Write-Host "Do you want to continue anyway? (yes/no)" -ForegroundColor Yellow
    $continueDespiteBeingBehind = Read-Host

    if ($continueDespiteBeingBehind -ne "yes") {
        Write-Host "Promotion aborted." -ForegroundColor Red
        exit 0
    }
}

if ($aheadCount -eq 0) {
    Write-Host "Staging is not ahead of main. There are no changes to promote." -ForegroundColor Yellow
    Write-Host "Do you want to continue anyway? (yes/no)" -ForegroundColor Yellow
    $continueNoChanges = Read-Host

    if ($continueNoChanges -ne "yes") {
        Write-Host "Promotion aborted." -ForegroundColor Red
        exit 0
    }
} else {
    Write-Host "Staging is ahead of main by $aheadCount commits." -ForegroundColor Green
}

# Show changes between staging and main
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

# Create pull request
Write-Host "Ready to create pull request from staging to main." -ForegroundColor Green
Write-Host "This will initiate the promotion to production." -ForegroundColor Yellow
Write-Host "Do you want to continue? (yes/no)" -ForegroundColor Yellow
$createPR = Read-Host

if ($createPR -eq "yes") {
    Write-Host "Enter a title for the pull request:" -ForegroundColor Yellow
    $prTitle = Read-Host

    if (-not $prTitle) {
        $prTitle = "Promote staging to production - $(Get-Date -Format 'yyyy-MM-dd')"
    }

    Write-Host "Enter a description for the pull request (optional - press Enter to skip):" -ForegroundColor Yellow
    $prDescription = Read-Host

    if ($ghInstalled) {
        # Use GitHub CLI to create PR
        Write-Host "Creating pull request via GitHub CLI..." -ForegroundColor Yellow
        
        if ($prDescription) {
            gh pr create --base main --head staging --title $prTitle --body $prDescription
        } else {
            gh pr create --base main --head staging --title $prTitle
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to create pull request automatically." -ForegroundColor Red
            Write-Host "Please create the pull request manually in GitHub." -ForegroundColor Yellow
        } else {
            Write-Host "Pull request created successfully!" -ForegroundColor Green
            
            # Offer to open PR in browser
            Write-Host "Do you want to open the pull request in your browser? (yes/no)" -ForegroundColor Yellow
            $openBrowser = Read-Host
            
            if ($openBrowser -eq "yes") {
                gh pr view --web
            }
        }
    } else {
        # Manual instructions
        Write-Host "Please create a pull request manually in GitHub:" -ForegroundColor Yellow
        Write-Host "1. Go to https://github.com/wsj3/tf1/pull/new/staging...main" -ForegroundColor Yellow
        Write-Host "2. Set the title to: $prTitle" -ForegroundColor Yellow
        if ($prDescription) {
            Write-Host "3. Set the description to: $prDescription" -ForegroundColor Yellow
        }
        Write-Host "4. Create the pull request and request the necessary reviews" -ForegroundColor Yellow
    }
    
    # Completion message
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "  Promotion Process Initiated!  " -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Ensure the pull request receives all required approvals" -ForegroundColor Yellow
    Write-Host "2. Merge the pull request in GitHub" -ForegroundColor Yellow
    Write-Host "3. Digital Ocean will automatically deploy to production" -ForegroundColor Yellow
    Write-Host "4. Verify the production environment at https://www.therapistsfriend.com" -ForegroundColor Yellow
} else {
    Write-Host "Promotion process aborted." -ForegroundColor Red
} 