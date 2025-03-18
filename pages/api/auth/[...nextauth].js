import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Hardcoded users for demonstration purposes
const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'demo@therapistsfriend.com',
    password: 'demo123',
    role: 'therapist'
  },
  {
    id: 2,
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password',
    role: 'therapist'
  }
];

// Simple configuration with minimal options
export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Find user with matching credentials
        const user = users.find(user => 
          user.email === credentials.email && 
          user.password === credentials.password
        );
        
        if (user) {
          console.log(`Login success for: ${credentials.email}`);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          };
        }
        
        console.log(`Login failed for: ${credentials.email}`);
        return null;
      }
    })
  ],
  
  // Define custom pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Callbacks
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.userId;
      }
      return session;
    }
  },
  
  // Use a simple secret
  secret: process.env.NEXTAUTH_SECRET || 'a-simple-fallback-secret-for-development',
  
  // Enable debugging
  debug: true,
}); 