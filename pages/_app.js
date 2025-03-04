import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '../utils/auth';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  // Use both providers for backwards compatibility while migrating
  return (
    <SessionProvider 
      session={pageProps.session}
      // Force refresh the session every 5 minutes
      refetchInterval={5 * 60}
      // Re-fetch session when window focuses
      refetchOnWindowFocus={true}
    >
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </SessionProvider>
  );
}

export default MyApp; 