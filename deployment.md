# Deployment Guide for Therapists Friend

This document outlines the deployment process for the Therapists Friend application, including both local development and production deployment procedures.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local for development, Neon PostgreSQL for production)
- Git
- PowerShell 7+ (for Windows deployments)

## Environment Configuration

The application uses separate environment files for different environments:

- `.env.local` - For local development
- `.env.production` - For production deployment

Ensure these files are properly configured with the appropriate database connection strings and other environment variables.

### Example `.env.production`:

```
DATABASE_URL="postgresql://username:password@production-db-host:5432/therapists_friend"
NODE_ENV="production"
# Add other production-specific environment variables
```

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd therapists-friend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the local database:
   ```bash
   npx prisma migrate dev
   npm run seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

The application is deployed to a Google production container. To deploy to production, follow these steps:

1. Ensure all changes are committed and pushed to the main branch
2. Run the deployment script from the project root:
   ```powershell
   ./deploy.ps1
   ```

The deployment script will handle:
- Building the application
- Running tests
- Creating a backup of the current production database
- Deploying to the Google production container
- Applying database migrations

### Manual Deployment (if needed)

If you need to deploy manually without using the script:

1. Build the application:
   ```bash
   npm run build
   ```

2. Apply database migrations:
   ```bash
   npx prisma migrate deploy
   ```

3. Deploy to the Google production container (refer to Google Cloud documentation for specific steps)

## Backup Procedure

Before each deployment, the database is backed up automatically by the deployment script. To manually create a backup, run:

```powershell
./backup.ps1
```

Backups are stored in the `backups` directory. See `backup_readme.md` for more details on the backup process.

## Deployment Verification

After deployment, verify the application is working correctly by:

1. Accessing the application URL
2. Testing critical features and workflows
3. Checking database migrations have been applied successfully
4. Monitoring logs for any errors or warnings

## Rollback Procedure

If issues are encountered after deployment:

1. Identify the issue through logs and monitoring
2. Apply fixes if possible and redeploy
3. If necessary, restore from the most recent backup:
   ```powershell
   ./backup.ps1 restore --backup-file <filename>
   ```

## Update History

| Date | Version | Changes | Deployed By |
|------|---------|---------|-------------|
| 2024-02-28 | 0.1.0 | Initial Prisma ORM setup | [Your Name] |

**Note:** Update this document whenever changes are made to the deployment process. 