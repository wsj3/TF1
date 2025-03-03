# Deployment Guide for Therapists Friend

This document outlines the deployment process for the Therapists Friend application, including both local development and production deployment procedures.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local for development, Neon PostgreSQL for production)
- Git
- PowerShell 7+ (for Windows deployments)
- Vercel account (for frontend deployment)

## Environment Configuration

The application uses separate environment files for different environments:

- `.env.local` - For local development
- `.env.staging` - For staging deployment
- `.env.production` - For production deployment

Ensure these files are properly configured with the appropriate database connection strings and other environment variables.

### Example `.env.production`:

```
DATABASE_URL="postgresql://neondb_owner:password@production-db-host/neondb?sslmode=require"
NODE_ENV="production"
NEXTAUTH_URL="https://tf-1.vercel.app"
NEXTAUTH_SECRET="your-production-secret"
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

## Deployment Options

The application can be deployed using two different methods:

1. **Vercel Deployment** (Recommended for frontend)
2. **Google Container Deployment** (Legacy method)

## Vercel Deployment

### Initial Setup

1. Connect your GitHub repository to Vercel:
   - Go to [Vercel](https://vercel.com/new)
   - Import your repository
   - Configure the project settings

2. Configure environment variables in Vercel dashboard:
   - Add all required environment variables from your `.env.production` file
   - Set up branch-specific environment variables for staging/production

3. Set up custom domains:
   - `staging.tf-1.vercel.app` for staging
   - `tf-1.vercel.app` for production

### Database Branching with Neon

The application uses Neon PostgreSQL's branching functionality to maintain separate databases for different environments:

1. **Main Branch**: Production database
   - Connected to the `main` branch deployment in Vercel
   - Used for live, production data

2. **Staging Branch**: Pre-production testing database
   - Created as a branch from `main` in Neon console
   - Connected to the `staging` branch deployment in Vercel
   - Used for testing before promoting to production

3. **Development Branches**: For individual feature development
   - Can be created as needed for feature development
   - Each gets its own connection string

To create a new database branch in Neon:
1. Go to the Neon console (console.neon.tech)
2. Navigate to your project > Branches
3. Click "Create branch"
4. Name it according to its purpose (e.g., "staging", "feature/user-auth")
5. Select the parent branch (usually `main`)
6. Copy the new connection string for use in the appropriate environment

### Deployment Process

The application follows a GitOps approach using Vercel's continuous deployment:

1. **Development Branch**: Local development and integration
2. **Staging Branch**: Pre-production testing
3. **Main Branch**: Production deployment

When code is pushed to any of these branches, Vercel automatically deploys:
- Feature branches get preview deployments
- Staging branch deploys to staging environment
- Main branch deploys to production environment

### Database Migrations

Before each deployment, ensure database migrations are applied to the appropriate database branch:

```bash
# For staging
npx dotenv -e .env.staging -- prisma migrate deploy

# For production
npx dotenv -e .env.production -- prisma migrate deploy
```

## Google Container Deployment (Legacy)

The application can still be deployed to a Google production container. To deploy to production, follow these steps:

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
4. For Vercel deployments, you can also roll back to a previous deployment from the Vercel dashboard

## Update History

| Date | Version | Changes | Deployed By |
|------|---------|---------|-------------|
| 2024-02-28 | 0.1.0 | Initial Prisma ORM setup | [Your Name] |
| 2024-02-28 | 0.2.0 | Added Vercel deployment process | [Your Name] |
| 2024-11-25 | 0.3.0 | Fix authentication flow and page rendering issues. Add login functionality, profile page, and custom document | [Your Name] |

**Note:** Update this document whenever changes are made to the deployment process.

## Recent Changes (March 2, 2025)

### Authentication System Implementation
1. Added NextAuth.js integration with credentials provider
2. Created authentication pages and components:
   - `/pages/auth/signin.js` - Sign-in page
   - `/pages/api/auth/[...nextauth].js` - NextAuth.js configuration
   - `/components/SessionWrapper.js` - Session management HOC

### Protected Routes Setup
1. Updated protected pages to use `withSession` HOC:
   - `/pages/dashboard.js`
   - `/pages/profile.js`
2. Configured routes to handle authentication state properly
3. Added automatic redirection to sign-in for unauthenticated users

### Next.js Configuration Updates
1. Modified `next.config.js`:
   - Removed `unstable_runtimeJS` option
   - Updated `exportPathMap` to handle static and dynamic pages correctly
   - Configured proper page extensions

### Environment Variables
Required environment variables in Vercel:
1. `NEXTAUTH_SECRET` - JWT encryption key (generated using crypto)
2. `NEXTAUTH_URL` - Full URL of the deployed application

### Home Page Updates
1. Simplified layout for better user experience
2. Added conditional rendering for authentication state:
   - Shows "Sign In" button for unauthenticated users
   - Shows "Go to Dashboard" for authenticated users

## Deployment Steps
1. Ensure all code changes are committed to the staging branch
2. Configure environment variables in Vercel:
   ```
   NEXTAUTH_SECRET=[generated-secret-key]
   NEXTAUTH_URL=https://[your-vercel-deployment-url]
   ```
3. Deploy using Vercel CLI:
   ```bash
   vercel deploy --prod
   ```

## Demo Access
Test credentials for the application:
- Email: `demo@therapistsfriend.com`
- Password: `demo123`

## Troubleshooting
If authentication issues occur:
1. Verify environment variables are set correctly in Vercel
2. Check that NextAuth.js configuration matches the environment
3. Clear browser cache or test in incognito mode
4. Review Vercel deployment logs for any session-related errors 