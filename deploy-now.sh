#!/bin/bash
# Simple deployment script for the current repository structure

echo "====================================="
echo "  TF1 Deployment to Staging Branch   "
echo "====================================="
echo ""

echo "This will add, commit, and push all your changes to the staging branch."
echo "Are you sure you want to proceed? (yes/no)"
read confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Deployment aborted."
    exit 0
fi

# Add all changes
echo "Adding all changes..."
git add .

# Commit changes
echo "Enter a commit message (or press Enter for default):"
read commit_message

if [ -z "$commit_message" ]; then
    commit_message="Deploy to staging - $(date +'%Y-%m-%d %H:%M:%S')"
fi

echo "Committing with message: $commit_message"
git commit -m "$commit_message"

# Push to staging branch
echo "Pushing to staging branch..."
git push origin staging

echo "====================================="
echo "  Deployment Completed!              "
echo "====================================="
echo ""
echo "Changes have been pushed to the staging branch."
echo "Check your staging environment to verify the deployment." 