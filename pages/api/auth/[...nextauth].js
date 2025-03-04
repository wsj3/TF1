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

// Log all environment variables for debugging
console.log('Environment Variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);

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
          
          // Add your own authentication logic here
          const user = users.find(user => 
            user.email === credentials.email && 
            user.password === credentials.password
          );
          
          if (user) {
            console.log(`User authenticated: ${user.email}`);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            };
          }
          
          console.log('Authentication failed: Invalid credentials');
          return null; // Return null instead of throwing an error
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // Error code passed in query string as ?error=
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add role to JWT token
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role to session
      if (token) {
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-fallback-secret-key', // Replace in production
  debug: true, // Enable debugging for all environments until we resolve the issue
}); 