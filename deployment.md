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

## Recent Deployments

### Staging Deployment - [Current Date]
1. Deployed authentication fixes:
   - Fixed issues with NextAuth URL configuration to properly handle different environments
   - Updated session handling to use the correct origins for redirects
   - Added more robust environment detection for both development and staging
2. Deployment URL: https://tf-1-17gn3e8ty-will-johnstons-projects-4f35a9d5.vercel.app
3. Deployment was successful with no migration changes needed
4. Test account: demo@therapistsfriend.com / demo123

**Note:** All users should clear their browser cache and cookies if experiencing any authentication issues after this deployment.

## Recent Changes (May 1, 2025)

### Authentication System Update
1. **Migrated from NextAuth.js to Custom Authentication System**
   - Removed NextAuth.js dependencies and components
   - Implemented custom authentication through the `utils/auth.js` module
   - Updated all protected pages to use the new authentication system
   - Updated pages:
     - `/pages/clients.js`
     - `/pages/tasks.js`
     - `/pages/appointments.js`
     - `/pages/sessions.js`
     - `/pages/profile.js`
     - `/pages/billing.js`
     - `/pages/diagnosis.js`

2. **Authentication Configuration Changes**
   - Custom auth system relies on different environment variables:
     - `JWT_SECRET` - Required for JWT token generation and validation
     - `API_BASE_URL` - Base URL for authentication API endpoints
     - `AUTH_COOKIE_NAME` - Name of the cookie used for authentication (default: 'auth-token')

3. **Protected Routes Changes**
   - All protected routes now use `withAuth` HOC instead of `withSession`
   - Authentication state is now managed via `useAuth` hook

### Environment Variable Changes
Required environment variables in Vercel:
1. `JWT_SECRET` - Secret key for JWT token signing (previously NEXTAUTH_SECRET)
2. `API_BASE_URL` - Authentication API base URL

### Deployment Considerations
1. **Before Deployment**:
   - Ensure all authentication environment variables are configured in production
   - Back up the current deployment state using `./backup.ps1`
   - Verify that the custom auth system works in the staging environment

2. **Potential Issues**:
   - Users may need to log in again after deployment
   - Previous sessions will be invalidated
   - Ensure the authentication API endpoints are accessible from the production environment

3. **Testing After Deployment**:
   - Test login flow
   - Test protected page access
   - Test session persistence across page refreshes
   - Verify proper redirection for unauthenticated users

### Rollback Plan
If authentication issues occur:
1. Restore the previous deployment from backup:
   ```powershell
   ./backup.ps1 restore --backup-file <latest-backup>
   ```
2. Verify that the previous environment variables are still in place
3. Update the deployment documentation with the rollback information

## Troubleshooting Authentication Issues

### Common Authentication Issues
1. **Session Not Persisting**
   - Check that cookies are being properly set and read
   - Verify JWT token expiration times
   - Check for CORS issues with authentication API

2. **API Connection Problems**
   - Verify API_BASE_URL is correctly set
   - Check network logs for authentication request failures
   - Verify API is accessible from the production environment

3. **JWT Validation Errors**
   - Ensure JWT_SECRET matches between client and server
   - Check token format and signing algorithm
   - Verify clock synchronization if using time-based tokens

### Recovery Steps
1. Clear browser cache and cookies
2. Try authentication in an incognito window
3. Check server logs for authentication errors
4. Contact the development team if issues persist 