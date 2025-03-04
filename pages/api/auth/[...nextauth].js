import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// For demo purposes - replace with your actual user authentication
const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'demo@therapistsfriend.com',
    password: 'demo123', // In production, use hashed passwords
    role: 'therapist'
  },
  {
    id: 2,
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password', // In production, use hashed passwords
    role: 'therapist'
  }
];

// Determine the base URL based on environment
const baseUrl = process.env.NEXTAUTH_URL || 
               (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

// Log critical configuration for debugging
console.log('=== NextAuth Configuration ===');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`NEXTAUTH_URL: ${baseUrl}`);
console.log(`Using debug mode: ${process.env.NEXTAUTH_DEBUG === 'true' || true}`);

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log(`Login attempt with email: ${credentials.email}`);
          
          // Find user with matching credentials
          const user = users.find(user => 
            user.email === credentials.email && 
            user.password === credentials.password
          );
          
          if (user) {
            console.log(`User authenticated successfully: ${user.email}`);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            };
          }
          
          console.log(`Authentication failed for: ${credentials.email}`);
          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to JWT token
      if (user) {
        token.role = user.role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data to session
      if (token) {
        session.user.role = token.role;
        session.user.id = token.userId;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Use a consistent secret across environments
  secret: process.env.NEXTAUTH_SECRET || 
         (process.env.NODE_ENV === 'production' 
          ? undefined // Force error in production if secret is missing
          : 'dev-secret-do-not-use-in-production'),
  // Enable debugging based on environment variable or always in development
  debug: process.env.NEXTAUTH_DEBUG === 'true' || process.env.NODE_ENV !== 'production',
}); 