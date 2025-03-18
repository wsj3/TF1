#!/bin/bash
# Backup Files Script for Therapist's Friend
# This script creates a complete backup of ALL files and folders in the project directory with NO exclusions

echo -e "\e[36mTherapist's Friend - Complete File Backup Script\e[0m"
echo -e "\e[36m====================================================\e[0m"

# Get current timestamp for the backup folder name
timestamp=$(date +"%Y%m%d_%H%M%S")
backup_dir="backups/full_backup_$timestamp"

# Create the backup directory if it doesn't exist
if [ ! -d "backups" ]; then
    mkdir -p backups
    echo -e "\e[32mCreated backups directory\e[0m"
fi

# Create timestamp directory
mkdir -p "$backup_dir"
echo -e "\e[32mCreated backup directory: $backup_dir\e[0m"

# Copy ALL files and folders to the backup directory with no exclusions
echo -e "\e[33mStarting complete backup (including all files and directories)...\e[0m"
echo -e "\e[33mThis may take some time if node_modules is large...\e[0m"

# Check if rsync is available
if command -v rsync >/dev/null 2>&1; then
    # Use rsync for more efficient copying - but with no exclusions
    rsync -av --progress ./ "$backup_dir/" --exclude="$backup_dir"
else
    # Fallback to cp if rsync is not available
    echo -e "\e[33mrsync not found, using cp command instead\e[0m"
    # The only thing we exclude is the backup directory itself to avoid recursion
    for file in $(find . -type f -not -path "./backups/*"); do
        dir=$(dirname "$file" | sed 's/^\.\///')
        if [ "$dir" = "." ]; then
            # It's a file in the root directory
            echo -e "\e[90mBacking up file: $(basename "$file")\e[0m"
            cp "$file" "$backup_dir/"
        else
            # It's a file in a subdirectory
            echo -e "\e[90mBacking up file: $file\e[0m"
            mkdir -p "$backup_dir/$dir"
            cp "$file" "$backup_dir/$dir/"
        fi
    done
    # Also copy all empty directories
    find . -type d -not -path "./backups/*" -not -path "$backup_dir/*" | while read -r dir; do
        if [ "$dir" != "." ]; then
            target_dir="${dir#./}"
            mkdir -p "$backup_dir/$target_dir"
        fi
    done
fi

echo -e "\e[32mBackup completed successfully!\e[0m"
echo -e "\e[36mBackup stored in: $backup_dir\e[0m"

# Display backup size
backup_size=$(du -sh "$backup_dir" | cut -f1)
echo -e "\e[36mBackup size: $backup_size\e[0m"

# List of backups
echo -e "\n\e[33mExisting backups:\e[0m"
for dir in backups/full_backup_*; do
    if [ -d "$dir" ]; then
        size=$(du -sh "$dir" | cut -f1)
        echo -e "\e[97m$(basename "$dir") - $size\e[0m"
    fi
done 