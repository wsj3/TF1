import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function withSession(Component, options = {}) {
  const { requireAuth = false } = options;
  
  // This is now just a client-side fallback - we'll use getServerSideProps for the main protection
  function WrappedComponent(props) {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    useEffect(() => {
      // Only run this on the client side
      if (typeof window === 'undefined') return;
      
      if (requireAuth && status === 'unauthenticated') {
        router.replace('/auth/signin');
      }
    }, [requireAuth, router, status]);
    
    if (requireAuth) {
      if (status === 'loading') {
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        );
      }
      
      if (status === 'unauthenticated') {
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-white">Redirecting to sign in...</div>
          </div>
        );
      }
    }
    
    return <Component {...props} />;
  }
  
  // Copy getInitialProps or getServerSideProps so they're also executed
  if (Component.getInitialProps) {
    WrappedComponent.getInitialProps = Component.getInitialProps;
  }
  
  return WrappedComponent;
}

// Use this in _app.js to wrap the entire application
export function SessionProvider({ children }) {
  const { status } = useSession();
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  return <>{children}</>;
} 