# PowerShell script to fix database connection and restart the development server

Write-Host "Therapist's Friend Database Fix Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Function to test database connection
function Test-DatabaseConnection {
    param (
        [string]$ConnectionString
    )
    
    Write-Host "Testing connection: $ConnectionString" -ForegroundColor Yellow
    
    try {
        # Create .env.test with the connection string
        Set-Content -Path ".env.test" -Value "DATABASE_URL=`"$ConnectionString`""
        
        # Run the test script - fixed syntax
        $output = node -e "
        const { PrismaClient } = require('@prisma/client');
        async function testConnection() {
            try {
                const prisma = new PrismaClient();
                await prisma.$connect();
                console.log('SUCCESS: Connected to database');
                const count = await prisma.user.count();
                console.log(`Found ${count} users in the database`);
                await prisma.$disconnect();
                process.exit(0);
            } catch (e) {
                console.error('FAILED: ' + e.message);
                process.exit(1);
            }
        }
        testConnection();
        " 2>&1
        
        if ($output -match "SUCCESS") {
            Write-Host "✅ Connection successful!" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Connection failed: $output" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Error testing connection: $_" -ForegroundColor Red
        return $false
    } finally {
        if (Test-Path ".env.test") {
            Remove-Item ".env.test"
        }
    }
}

# Test various connection strings
$connectionStrings = @(
    "postgresql://postgres:postgres@localhost:5432/therapists_friend",
    "postgresql://postgres@localhost:5432/therapists_friend",
    "postgresql://postgres:postgres@127.0.0.1:5432/therapists_friend",
    "postgresql://postgres:postgres@localhost:5432/postgres",
    "postgresql://postgres:@localhost:5432/postgres"
)

$successfulConnection = $null

foreach ($conn in $connectionStrings) {
    if (Test-DatabaseConnection -ConnectionString $conn) {
        $successfulConnection = $conn
        break
    }
}

if ($null -ne $successfulConnection) {
    Write-Host ""
    Write-Host "Found working connection string: $successfulConnection" -ForegroundColor Green
    Write-Host "Updating .env.local file..." -ForegroundColor Yellow
    
    # Update .env.local
    Set-Content -Path ".env.local" -Value "# Local PostgreSQL connection
DATABASE_URL=`"$successfulConnection`""
    
    Write-Host "✅ .env.local updated successfully!" -ForegroundColor Green
    
    # Regenerate Prisma client
    Write-Host "Regenerating Prisma client..." -ForegroundColor Yellow
    npx prisma generate
    
    Write-Host ""
    Write-Host "✅ Database connection fixed!" -ForegroundColor Green
    Write-Host "You can now restart your development server with 'npm run dev'" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Could not find a working connection string." -ForegroundColor Red
    Write-Host "Please check your PostgreSQL installation:" -ForegroundColor Yellow
    Write-Host "1. Verify PostgreSQL is installed and running" -ForegroundColor Yellow
    Write-Host "2. Check the username and password for your PostgreSQL installation" -ForegroundColor Yellow
    Write-Host "3. Make sure the database 'therapists_friend' exists" -ForegroundColor Yellow
    Write-Host "4. If needed, create the database manually with: CREATE DATABASE therapists_friend;" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "Alternative approach:" -ForegroundColor Yellow
    Write-Host "1. Edit .env.local to set DATABASE_URL to 'postgresql://postgres:YOUR_PASSWORD@localhost:5432/therapists_friend'" -ForegroundColor Yellow
    Write-Host "2. Replace YOUR_PASSWORD with your actual PostgreSQL password" -ForegroundColor Yellow
    Write-Host "3. Restart your development server with 'npm run dev'" -ForegroundColor Yellow
} 