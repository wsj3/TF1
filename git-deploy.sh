#!/bin/bash
# Incremental Git Deployment Script (Bash version)
# Use after first deploying with fresh-git-deploy.sh

echo "===================================="
echo "  Incremental Git Deployment        "
echo "===================================="
echo ""

echo "This will commit and push your local changes to the staging branch."
echo "Are you sure you want to proceed? (yes/no)"
read confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Deployment aborted."
    exit 0
fi

# Check if we're on the staging branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "staging" ]; then
    echo "You are currently on branch: $current_branch"
    echo "Do you want to switch to the staging branch? (yes/no)"
    read switch_branch
    
    if [ "$switch_branch" = "yes" ]; then
        git checkout staging
        if [ $? -ne 0 ]; then
            echo "Failed to switch to staging branch. Aborting."
            exit 1
        fi
    else
        echo "Deployment aborted. Please switch to staging branch manually."
        exit 0
    fi
fi

echo "Adding all changes..."
git add .

echo "Enter a commit message (or press Enter for default):"
read commit_message

if [ -z "$commit_message" ]; then
    commit_message="Deploy to staging - $(date +'%Y-%m-%d %H:%M:%S')"
fi

echo "Committing changes..."
git commit -m "$commit_message"

echo "Pushing to staging branch..."
git push origin staging

echo "===================================="
echo "  Deployment Completed!             "
echo "===================================="
echo ""
echo "Changes have been pushed to the staging branch."
echo "Check your staging environment to verify the deployment." 