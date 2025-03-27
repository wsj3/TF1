# Deployment Guide for Therapists Friend

## IMPORTANT: Preserving Local Development Environment

**WARNING: The local development codebase must NEVER be overwritten during deployment processes.**

When deploying to staging or production:
1. Always use the Git-based deployment workflow to push local code to the repository
2. Digital Ocean will automatically pull from the Git repository
3. Never pull code from staging/production back to your local environment
4. If you need to restore a backup, create a separate directory for the restoration
5. Keep local development, staging, and production environments strictly separated

This protection ensures that your local development work is never lost during deployment operations.

## Git-based Deployment Workflow

The project uses a Git-based deployment workflow:

1. **Development Flow**:
   - Feature development on feature branches
   - Feature branches merge to `staging` branch
   - Push to `staging` branch triggers automatic deployment to staging environment on Digital Ocean
   - **IMPORTANT: Deployments always flow FROM local TO git TO Digital Ocean, never in reverse**

2. **Staging to Production Process**:
   a. Complete testing on staging environment
   b. Create a pull request from `staging` to `main`
   c. Required approvals:
      - Code review approval
      - QA sign-off
      - Product owner approval
   d. After approvals, merge PR to main
   e. **Automatic Production Deployment**:
      - Digital Ocean automatically detects the push to main
      - Creates a production deployment on the production server

   **Automated Promotion Script**:
   - Use the `promote-to-production.ps1` script to automate the promotion process:
     ```powershell
     ./promote-to-production.ps1
     ```
   - This script will:
     - Ensure you're on the staging branch
     - Pull latest changes
     - Check if staging is ahead of main
     - Show changes to be promoted
     - Run through a pre-launch checklist
     - Create a pull request from staging to main (using GitHub CLI if available)
     - Provide next steps for completing the promotion process

3. **Branch Configuration**:
   - `main` branch → Production Digital Ocean environment
   - `staging` branch → Staging Digital Ocean environment

4. **How It Works**:
   - When code is pushed to the `staging` branch, Digital Ocean automatically deploys to staging
   - When code is pushed to the `main` branch, Digital Ocean automatically deploys to production
   - Each environment has its own Digital Ocean App Platform configuration

## Repository Information

- **GitHub Repository**: https://github.com/wsj3/tf1
- **Branches**:
  - `main`: Used for production deployments
  - `staging`: Used for staging deployments

## Environment Setup

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/wsj3/tf1.git
   cd tf1
   ```
2. Copy `.env.local.example` to `.env.local`
3. Configure local environment variables
4. Run `npm install` to install dependencies
5. Run `npm run dev` to start the development server

### Staging Environment
1. Copy `.env.staging.local.example` to `.env.staging.local`
2. Configure staging environment variables
3. Deploy to staging by pushing to the staging branch:
   ```bash
   git add .
   git commit -m "Deploy to staging"
   git push origin staging
   ```
   Digital Ocean will automatically detect the push and deploy the changes.

### Production Environment
1. Copy `.env.production.example` to `.env.production`
2. Configure production environment variables
3. Deploy to production by merging to the main branch:
   ```bash
   # Create a PR from staging to main in GitHub
   # After approvals, merge the PR
   ```
   Digital Ocean will automatically detect the push to main and deploy the changes.

## Digital Ocean App Platform Setup

1. **GitHub Integration**:
   - Digital Ocean App Platform is connected to the GitHub repository
   - You must grant permission for Digital Ocean to access the repository in GitHub
   - If you see "GitHub app does not have access to repo" error, click "Edit your GitHub permissions" to fix

2. **Environment Configuration**:
   - Staging environment: Uses the `staging` branch
   - Production environment: Uses the `main` branch
   - Both environments use the Dockerfile for building the application

3. **Deployment Process**:
   - Digital Ocean automatically detects changes to the connected branches
   - Builds the application using the Dockerfile
   - Deploys the application to the appropriate environment

## Troubleshooting

### Common Issues
1. Database Connection
   - Verify connection string format for Neon PostgreSQL
   - Check database credentials
   - Ensure database is accessible from the deployment environment

2. Migration Errors
   - Check for conflicting migrations
   - Verify database schema
   - Review migration logs

3. Deployment Failures
   - Check Digital Ocean build logs
   - Verify the Git repository is properly connected to Digital Ocean
   - Review deployment status in Digital Ocean dashboard
   - Look for missing exports or module import errors during build
   - Ensure proper property names are used (e.g., using `name` instead of `title` in templates)

4. **Local Codebase Protection**
   - If deployment script asks to overwrite local files, STOP immediately
   - Never allow any process to overwrite your local development files
   - Use backup and restore processes only on server environments, not local development
   - Keep separate backups of your local development environment

5. **GitHub Access Issues**
   - If Digital Ocean cannot access the GitHub repository, check the GitHub app permissions
   - Go to GitHub Settings > Applications > Authorized OAuth Apps > Digital Ocean
   - Ensure the repository has been granted access

### Backup and Recovery
1. Create database backup:
   ```powershell
   ./backup.ps1
   ```

2. Restore from backup:
   ```powershell
   ./backup.ps1 restore --backup-file <latest-backup>
   ```
   **WARNING: When restoring backups, ensure you are not overwriting your local development files.**
   **Always restore to a clean environment or the intended server environment.**

## Recent Changes

### March 27, 2025
- Fixed missing exports in utility files that were causing build failures
- Added missing `getAllTemplates` export in `utils/treatmentTemplates.js`
- Added missing `getClientById` export in `utils/clientUtils.js`
- Added missing `aiAgent` export in `utils/aiFramework/agent.js`
- Fixed property name mismatch in templates.js (using `name` instead of `title`)
- Added new `promote-to-production.ps1` script to automate staging to production promotion process

### July 15, 2023
- Implemented Safe API pattern to prevent Prisma client-side errors
- Added comprehensive error handling for all API endpoints
- Created apiHelpers.js utility for safe API calls
- See docs/api-protection.md for implementation details

### June 12, 2023
- Implemented Neon PostgreSQL database integration
- Added Prisma ORM and database models for clients, appointments, tasks, sessions, and billing
- Created AI Agent functions with real database integration

### June 10, 2023
- Repository migrated to https://github.com/wsj3/tf1
- Successfully deployed to Digital Ocean staging environment
- Updated deployment documentation

### May 1, 2025
- Migrated from NextAuth.js to custom authentication system
- Updated environment variables for authentication
- Added new deployment steps for auth system

### March 2, 2025
- Implemented authentication system
- Updated deployment configuration for database connections 

## Database Migration Instructions

### Setting Up Neon PostgreSQL Database

1. **Create a Neon Project**:
   - Go to https://console.neon.tech
   - Sign up or log in to your account
   - Create a new project (e.g., "therapyapp")
   - Select the appropriate region for your deployment

2. **Connection Information**:
   - After project creation, go to the "Connection Details" section
   - Note the connection string format:
     ```
     postgresql://user:password@db.example.neon.tech/therapyapp?sslmode=require
     ```
   - Replace the placeholder values with your actual credentials

3. **Environment Configuration**:
   - Add the connection string to your environment files:
     - For development: `.env.local`
     - For staging: `.env.staging`
     - For production: `.env.production`
   - Ensure the connection string is properly formatted and encoded if it contains special characters

### Prisma Database Migrations

1. **Initial Migration**:
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Create migration
   npx prisma migrate dev --name init
   ```

2. **Apply Migrations to Production**:
   ```bash
   # Set DATABASE_URL to production database
   # Important: Use a one-time environment variable, don't modify your local .env file
   $env:DATABASE_URL="postgresql://user:password@production-db.neon.tech/therapyapp?sslmode=require"
   
   # Deploy migrations
   npx prisma migrate deploy
   ```

3. **Schema Changes**:
   When making changes to the Prisma schema:
   ```bash
   # Create a new migration
   npx prisma migrate dev --name describe_your_changes
   
   # Apply to other environments as needed
   npx prisma migrate deploy
   ```

4. **Verify Migrations**:
   - Check migration status:
     ```bash
     npx prisma migrate status
     ```
   - View database in Prisma Studio:
     ```bash
     npx prisma studio
     ```

### Backup and Restore Database

1. **Export Database**:
   ```bash
   # Using pg_dump (install PostgreSQL tools if needed)
   pg_dump "postgresql://user:password@db.neon.tech/therapyapp?sslmode=require" > backup.sql
   ```

2. **Restore Database**:
   ```bash
   # Using psql (install PostgreSQL tools if needed)
   psql "postgresql://user:password@db.neon.tech/therapyapp?sslmode=require" < backup.sql
   ```

3. **Automated Backup Script**:
   - The project includes a `backup.ps1` PowerShell script
   - Run it with appropriate parameters to backup both files and database:
     ```powershell
     ./backup.ps1 -backupDatabase
     ``` 