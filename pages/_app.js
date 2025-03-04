import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  // Use the layout defined at the page level, if available
  return (
    <SessionProvider 
      session={pageProps.session}
      // Force refresh the session every 5 minutes
      refetchInterval={5 * 60}
      // Re-fetch session when window focuses
      refetchOnWindowFocus={true}
    >
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp; 