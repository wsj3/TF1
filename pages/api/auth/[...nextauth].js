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
  }
];

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Add your own authentication logic here
        const user = users.find(user => 
          user.email === credentials.email && 
          user.password === credentials.password
        );
        
        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          };
        }
        
        return null;
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
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
    }
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-fallback-secret-key', // Replace in production
}); 