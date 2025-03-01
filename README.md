# Therapists Friend

A comprehensive platform designed to help therapists manage their practice, including client information, session scheduling, and treatment plans.

## Features

- Client management
- Session scheduling and tracking
- Progress notes and treatment plans
- User authentication and authorization
- Dashboard with key metrics

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL (with Neon for production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL (for local development)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/therapists-friend.git
   cd therapists-friend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file based on the provided `.env.local` template
   - Update the database connection string to match your local PostgreSQL setup

4. Set up the database:
   ```bash
   npx prisma migrate dev --name init
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

The application is designed to be deployed on Vercel with a Neon PostgreSQL database. Refer to the `deployment.md` file for detailed deployment instructions.

### Environment Variables for Production

Make sure to set the following environment variables in your Vercel project:

- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `NEXTAUTH_URL`: Your production URL (e.g., https://therapists-friend.vercel.app)
- `NEXTAUTH_SECRET`: A secure random string for session encryption
- `NODE_ENV`: Set to "production"

## License

This project is licensed under the MIT License. 