# Deployment Guide for Therapists Friend

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
3. Deploy to staging using Vercel:
   ```bash
   vercel deploy
   ```

### Production Environment
1. Copy `.env.production.example` to `.env.production`
2. Configure production environment variables
3. Deploy to production using Vercel:
   ```bash
   vercel deploy --prod
   ```

## Database Setup

### Local Database
1. Install PostgreSQL locally
2. Create a new database named `therapists_friend_dev`
3. Update `.env.local` with local database connection string
4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

### Staging Database
1. Create a new database in Neon
2. Update `.env.staging.local` with staging database connection string
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Production Database
1. Create a new database in Neon
2. Update `.env.production` with production database connection string
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Deployment Protection Setup

### GitHub Branch Protection
1. Go to GitHub repository settings
2. Navigate to Branches > Branch protection rules
3. Add a rule for the `main` branch:
   - Enable "Require pull request reviews before merging"
   - Set required number of approvals
   - Enable "Require status checks to pass"
   - Enable "Include administrators"

### Vercel Deployment Protection
1. Go to Project Settings in Vercel dashboard
2. Navigate to "Deployment Protection"
3. Enable "Preview Deployment Protection":
   - This protects staging/preview deployments
   - Allows for secure testing before production

## Deployment Process

1. **Development Flow**:
   - Feature development on feature branches
   - Feature branches merge to `staging`
   - Automatic deployment to staging environment for testing

2. **Staging to Production Process**:
   a. Complete testing on staging environment
   b. Create a pull request from `staging` to `main`
   c. Required approvals:
      - Code review approval
      - QA sign-off
      - Product owner approval
   d. After approvals, merge PR to main

3. **Production Deployment**:
   - Go to Vercel dashboard
   - Navigate to the successful main branch deployment
   - Click "Promote to Production"
   - Verify the deployment details
   - Confirm the promotion

4. **Post-deployment Verification**:
   - Access the production URL
   - Verify critical functionality
   - Monitor error logs
   - Confirm database migrations

## Database Migrations

### Local Development
```bash
npx prisma migrate dev
```

### Staging/Production
```bash
npx prisma migrate deploy
```

### Creating a New Migration
1. Make changes to `prisma/schema.prisma`
2. Run migration:
   ```bash
   npx prisma migrate dev --name <migration-name>
   ```
3. Commit the migration files

## Environment Variables

### Required Variables
- `DATABASE_URL`: Database connection string
- `NEXTAUTH_SECRET`: JWT encryption key
- `NEXTAUTH_URL`: Full URL of the deployed application

### Optional Variables
- `NODE_ENV`: Environment (development/staging/production)
- `PORT`: Server port (default: 3000)

## Troubleshooting

### Common Issues
1. Database Connection
   - Verify connection string format
   - Check database credentials
   - Ensure database is running

2. Migration Errors
   - Check for conflicting migrations
   - Verify database schema
   - Review migration logs

3. Deployment Failures
   - Check build logs
   - Verify environment variables
   - Review Vercel deployment status

### Backup and Recovery
1. Create database backup:
   ```powershell
   ./backup.ps1
   ```

2. Restore from backup:
   ```powershell
   ./backup.ps1 restore --backup-file <latest-backup>
   ```

## Notes
- Keep environment variables secure
- Regularly update dependencies
- Monitor deployment logs
- Test thoroughly in staging before production
- Follow the GitOps workflow for deployments

**Note:** Update this document whenever changes are made to the deployment process. 