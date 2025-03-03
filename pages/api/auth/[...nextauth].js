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

// Determine the environment and URL
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const vercelUrl = process.env.VERCEL_URL;
const nextAuthUrl = process.env.NEXTAUTH_URL;

// Log all environment variables for debugging
console.log('Environment Variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`VERCEL_URL: ${vercelUrl}`);
console.log(`NEXTAUTH_URL: ${nextAuthUrl}`);
console.log(`VERCEL_ENV: ${process.env.VERCEL_ENV}`);

// Force localhost URL for development environment
let baseUrl;
if (isDevelopment) {
  baseUrl = 'http://localhost:3000';
  console.log('Development environment detected - forcing localhost URL');
} else if (isProduction && nextAuthUrl) {
  baseUrl = nextAuthUrl;
  console.log(`Production environment with NEXTAUTH_URL: ${baseUrl}`);
} else if (vercelUrl) {
  baseUrl = `https://${vercelUrl}`;
  console.log(`Using Vercel URL: ${baseUrl}`);
} else {
  baseUrl = 'https://staging-tf-1.vercel.app';
  console.log(`Falling back to default URL: ${baseUrl}`);
}

console.log(`NextAuth using base URL: ${baseUrl}`);

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
          throw new Error('Invalid email or password');
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error(error.message || 'An error occurred during authentication');
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
    async redirect({ url, baseUrl }) {
      console.log(`Redirect callback - URL: ${url}, baseUrl: ${baseUrl}`);
      
      // This ensures redirects stay on the same domain
      // If the URL starts with the base URL, use it directly
      if (url.startsWith(baseUrl)) {
        console.log(`Redirecting to same-origin URL: ${url}`);
        return url;
      }
      
      // Otherwise, make sure we stay on the same origin
      // For relative URLs like '/dashboard', prefix with baseUrl
      if (url.startsWith('/')) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log(`Redirecting to absolute URL: ${redirectUrl}`);
        return redirectUrl;
      }
      
      // For all other cases, go to the base URL
      console.log(`Redirecting to base URL: ${baseUrl}`);
      return baseUrl;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-fallback-secret-key', // Replace in production
  debug: true, // Enable debugging for all environments until we resolve the issue
}); 