# Therapists Friend Database Backup Guide

This document explains the database backup and restore process for the Therapists Friend application.

## Overview

Database backups are an essential part of the application maintenance process. The system automatically backs up the database before each deployment, but manual backups can also be created as needed.

All backups are stored in the `backups` directory as SQL dump files with timestamps in their names.

## Requirements

To use the backup scripts, you need:

- PowerShell 7+ (for Windows)
- PostgreSQL client tools (pg_dump, psql) installed and in your PATH
- Appropriate database credentials in your `.env.local` or `.env.production` file

## Backup Procedures

### Automatic Backups

A backup is automatically created whenever you run the deployment script `deploy.ps1`. These backups are stored in the `backups` directory with timestamps.

### Manual Backups

To create a manual backup:

```powershell
./backup.ps1
```

This will create a backup of the database as specified in your `.env.production` or `.env.local` file.

### Listing Backups

To list all available backups:

```powershell
./backup.ps1 list
```

This will display information about all backups, including:
- Filename
- Size
- Creation date/time

## Restore Procedures

To restore from a backup:

```powershell
./backup.ps1 restore
```

This will:
1. List all available backups
2. Prompt you to select a backup file
3. Ask for confirmation
4. Restore the database from the selected backup

You can also specify a backup file directly:

```powershell
./backup.ps1 restore --backup-file=tf_backup_20240101_120000.sql
```

⚠️ **WARNING**: Restoring will overwrite the current database with the backup data. This operation cannot be undone.

## Backup Retention Policy

The system automatically manages backup files and keeps only the 10 most recent backups to save disk space. When a new backup is created, older backups exceeding this limit are automatically removed.

## Backup File Format

Backup files follow this naming convention:
```
tf_backup_YYYYMMDD_HHMMSS.sql
```

Example: `tf_backup_20240228_142536.sql`

## Troubleshooting

### Common Backup Issues

- **Connection Failed**: Ensure the database credentials in your environment file are correct
- **Permission Denied**: Make sure the database user has appropriate permissions
- **Missing pg_dump/psql**: Ensure PostgreSQL client tools are installed and in your PATH

### Common Restore Issues

- **Cannot Connect to Drop Database**: Ensure you have superuser privileges on the database
- **Cannot Restore**: Check if the backup file exists and is not corrupted
- **Active Connections**: If the database cannot be dropped due to active connections, try stopping the application first

## Emergency Recovery

In case of critical data loss:

1. Stop the application
2. Run the restore procedure
3. Verify data integrity
4. Restart the application

## Additional Notes

- It's recommended to create manual backups before making significant changes to the database schema
- Consider copying important backups to an external storage location for additional safety
- Test the restore process periodically to ensure backups are functioning correctly 