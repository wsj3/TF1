@echo off
echo Fixing the local dashboard...

echo Regenerating Prisma client...
call npx prisma generate

echo Creating .env.local file...
(
echo # Local development environment variables
echo NEXTAUTH_URL=http://localhost:3000
echo NODE_ENV=development
echo.
echo # Local database connection
echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/therapists_friend"
echo.
echo # Authentication
echo JWT_SECRET="local-development-jwt-secret-key-for-testing-only"
echo API_BASE_URL="http://localhost:3000/api"
echo AUTH_COOKIE_NAME="auth-token"
echo.
echo # Feature flags
echo ENABLE_DEMO_MODE=true
echo DEBUG_MODE=true
) > .env.local

echo Stopping any running Next.js server...
taskkill /f /im node.exe

echo Starting Next.js development server...
npm run dev 