import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../utils/auth';

export function withSession(Component, options = {}) {
  const { requireAuth = false } = options;
  
  // This is now just a client-side fallback - we'll use getServerSideProps for the main protection
  function WrappedComponent(props) {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      // Only run this on the client side
      if (typeof window === 'undefined') return;
      
      if (requireAuth && !loading && !user) {
        router.replace('/auth/simple-signin');
      }
    }, [requireAuth, router, loading, user]);
    
    if (requireAuth) {
      if (loading) {
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        );
      }
      
      if (!user) {
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
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  return <>{children}</>;
} 