#!/bin/bash
# Fresh Git Deployment Script (Bash version)
# This script creates a fresh staging branch and pushes all code for a clean deployment

echo "===================================="
echo "  Fresh Git Deployment to Staging   "
echo "===================================="
echo ""

# Ask for confirmation
echo "This will create a fresh staging branch and push all local code."
echo "Are you sure you want to proceed? (yes/no)"
read confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Fresh deployment aborted."
    exit 0
fi

# Check if staging branch exists locally
git show-ref --verify --quiet refs/heads/staging
staging_exists=$?

git ls-remote --exit-code origin staging &> /dev/null
staging_exists_in_remote=$?

# Backup current work if needed
echo "Do you want to backup your current branch first? (yes/no)"
read backup_branch

if [ "$backup_branch" = "yes" ]; then
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_branch_name="backup_$timestamp"
    
    echo "Creating backup branch: $backup_branch_name..."
    git branch $backup_branch_name
    echo "Backup created as branch: $backup_branch_name"
fi

# Create fresh staging branch
echo "Creating fresh staging branch..."

# Save current branch name
current_branch=$(git branch --show-current)

# Create and checkout a clean staging branch from main/master
echo "Fetching latest main branch..."
git fetch origin main

# Check if main exists, otherwise try master
git show-ref --verify --quiet refs/remotes/origin/main
if [ $? -eq 0 ]; then
    base_branch="main"
else
    base_branch="master"
    echo "Using $base_branch as the base branch"
fi

# Delete existing staging branch if it exists
if [ $staging_exists -eq 0 ]; then
    echo "Removing existing local staging branch..."
    git branch -D staging
fi

# Create a new staging branch based on origin/main or origin/master
echo "Creating fresh staging branch from origin/$base_branch..."
git checkout -b staging origin/$base_branch

# Add all files from the current directory
echo "Adding all files to staging branch..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Fresh deployment to staging - $(date +'%Y-%m-%d %H:%M:%S')"

# Force push to origin staging
echo "Force pushing to origin staging..."
git push -f origin staging

echo "===================================="
echo "  Fresh Git Deployment Completed!   "
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Verify your deployment on the staging environment"
echo "2. After verification, you can use git-deploy.ps1 for incremental updates" 