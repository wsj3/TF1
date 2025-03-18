# Complete File Backup Documentation

This document describes how to use the file backup scripts to create complete copies of your Therapist's Friend application codebase.

## Overview

The file backup scripts create a timestamped copy of **ALL** files and folders in the project directory, including large directories like `node_modules`, `.next`, and `.git`. This ensures you have a true 100% complete backup of everything in your project.

Two versions of the script are provided:
- `backup_files.ps1` - PowerShell script for Windows
- `backup_files.sh` - Bash script for Unix/Linux/macOS or Git Bash on Windows

## Using the PowerShell Script

The PowerShell script is designed to run on Windows and can be executed directly from PowerShell or from the command prompt.

### Running the Backup

```powershell
# From PowerShell
.\backup_files.ps1

# From Command Prompt
powershell -File backup_files.ps1
```

## Using the Bash Script

The Bash script is designed to run in Unix-like environments including Git Bash on Windows.

### Running the Backup

```bash
# Make sure the script is executable (only needed once)
chmod +x backup_files.sh

# Run the backup
./backup_files.sh
```

## Backup Location

Backups are stored in the `backups` directory with a timestamp in the folder name:

```
backups/full_backup_YYYYMMDD_HHMMSS/
```

The timestamp format ensures that each backup has a unique name, making it easy to identify when each backup was created.

## Important Notes About Complete Backups

- These scripts perform a **complete** backup that includes all files and directories in your project.
- This includes the `node_modules` directory, which can be very large (potentially hundreds of MB or more).
- Backups will take longer to complete and use more disk space than typical backups that exclude large directories.

## Restoring From a Backup

To restore from a backup, simply copy the files from the backup directory back to your project directory.

```bash
# Example of restoring from a backup (bash)
cp -r backups/full_backup_20240306_123045/* .

# Example of restoring from a backup (PowerShell)
Copy-Item -Path backups/full_backup_20240306_123045/* -Destination . -Recurse
```

## Additional Information

- Each time you run the script, a new backup is created.
- The script displays information about the backup process, including the backup size.
- A list of existing backups is shown at the end of the script execution.
- The PowerShell script uses robocopy for more efficient copying when available.
- The Bash script uses rsync for more efficient copying when available.

## Troubleshooting

If you encounter any issues with the scripts:

1. Make sure you're running the scripts from the root directory of the project.
2. Verify that you have sufficient disk space for the backup.
3. Check that you have the necessary permissions to create directories and files.
4. For large backups (especially with node_modules), the process might take a while to complete. 