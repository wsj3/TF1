# Prisma Database Setup for Therapists Friend

This document provides guidance on working with the Prisma ORM in the Therapists Friend application.

## Database Setup

The application uses PostgreSQL as its database, with Prisma as the ORM layer. The connection information is stored in the `.env` file:

```
DATABASE_URL="postgresql://postgres:newpassword@localhost:5432/therapists_friend"
```

> ⚠️ **Note:** For production deployments, ensure you use a secure password and update the connection string.

## Schema Overview

The database schema in `prisma/schema.prisma` defines the following models:

- **User**: Therapists and administrators
- **Profile**: Additional therapist information
- **Client**: Patient/client records
- **Session**: Appointment scheduling
- **Note**: Session and client notes
- **TreatmentPlan**: Client treatment plans
- **Goal**: Goals within treatment plans
- **Task**: Client tasks and assignments

## Common Prisma Commands

### Generate Prisma Client

After any changes to the schema file, regenerate the Prisma client:

```bash
npx prisma generate
```

### Create Migrations

When you modify the schema, create a new migration:

```bash
npx prisma migrate dev --name descriptive_name
```

### Reset Database (Development Only)

To reset the database and apply all migrations:

```bash
npx prisma migrate reset
```

### Seed the Database

Populate the database with sample data:

```bash
npm run seed
# or
npx prisma db seed
```

### Visual Database Explorer

Open Prisma Studio to view and manage data:

```bash
npx prisma studio
```

## Using Prisma in Code

The application includes several examples of how to use Prisma:

1. **Singleton Pattern**: `src/api/prismaClient.js` - Demonstrates how to create a singleton instance
2. **Therapist API**: `src/api/therapistsApi.js` - CRUD operations for therapists
3. **Client API**: `src/api/clientsApi.js` - Client management, sessions, and treatment plans

### Basic Query Example

```javascript
import { prisma } from './api/prismaClient';

// Get all active clients for a therapist
async function getActiveClients(therapistId) {
  const clients = await prisma.client.findMany({
    where: {
      therapistId: therapistId,
      status: 'ACTIVE'
    },
    orderBy: {
      lastName: 'asc'
    }
  });
  return clients;
}
```

### Transactions Example

Use transactions for operations that modify multiple related records:

```javascript
const result = await prisma.$transaction(async (tx) => {
  // Create treatment plan
  const plan = await tx.treatmentPlan.create({
    data: {
      title: 'New Treatment Plan',
      description: 'Plan description',
      clientId: 'client-id',
      therapistId: 'therapist-id'
    }
  });
  
  // Add a goal to the plan
  const goal = await tx.goal.create({
    data: {
      description: 'Goal description',
      treatmentPlanId: plan.id
    }
  });
  
  return { plan, goal };
});
```

## Production Considerations

### Environment Variables

- Use different `.env` files for different environments:
  - `.env.local` - Local development
  - `.env.production` - Production settings

### Connection Pooling

For production, consider using connection pooling:

```javascript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  connectionLimit: 5
});
```

### Error Handling

Always implement proper error handling:

```javascript
try {
  const result = await prisma.user.findMany();
  return result;
} catch (error) {
  console.error('Database error:', error);
  // Log to monitoring service
  throw new Error('Failed to fetch users');
}
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma with Next.js](https://www.prisma.io/nextjs)
- [Database Schema Reference](https://www.prisma.io/docs/concepts/components/prisma-schema) 