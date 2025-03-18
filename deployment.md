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

3. **Branch Configuration**:
   - `main` branch → Production Digital Ocean environment
   - `staging` branch → Staging Digital Ocean environment

4. **How It Works**:
   - When code is pushed to the `staging` branch, Digital Ocean automatically deploys to staging
   - When code is pushed to the `main` branch, Digital Ocean automatically deploys to production
   - Each environment has its own Digital Ocean droplet and URL

## Environment Setup

### Local Development
1. Clone the repository
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
   
4. **Local Codebase Protection**
   - If deployment script asks to overwrite local files, STOP immediately
   - Never allow any process to overwrite your local development files
   - Use backup and restore processes only on server environments, not local development
   - Keep separate backups of your local development environment

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