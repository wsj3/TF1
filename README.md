# Therapists Friend

A comprehensive practice management application designed to streamline therapist workflows, improve client management, and integrate therapeutic tools.

## Architecture

- **Frontend/Backend**: Next.js 14+ with App Router
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Prisma
- **Deployment**: Vercel
- **Authentication**: Auth.js

## Development Setup

### Prerequisites
- Node.js 18+
- Git
- PostgreSQL (or Docker for local development)

### Local Development
1. Clone the repository
   ```bash
   git clone <repository-url>
   cd therapists-friend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   # Update .env.local with your database connection string
   ```

4. Run database migrations
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Environments

| Environment | Branch | URL |
|-------------|--------|-----|
| Development | development | Local |
| Staging | staging | staging.therapists-friend.app |
| Production | main | therapists-friend.app |

### Deployment Process

The application is deployed through Vercel's continuous deployment:
1. Create feature branches from development
2. Merge to development for integration testing
3. Merge to staging for pre-production testing
4. Merge to main for production deployment

See the [Deployment Guide](deployment.md) for more details.

## License

This project is licensed under the [MIT License](LICENSE). 