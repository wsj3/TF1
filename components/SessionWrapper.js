import { useSession, signIn } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export function SessionWrapper({ children, fallback = null }) {
  // Only try to access session on client side
  if (typeof window === 'undefined') {
    return fallback;
  }

  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return fallback;
  }

  return children(session, status);
}

export function withSession(Component, { requireAuth = false } = {}) {
  return function WrappedComponent(props) {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    useEffect(() => {
      if (requireAuth && status === 'unauthenticated') {
        console.log('Auth required, but user not authenticated. Redirecting to signin');
        // Use replace instead of push to avoid a history entry
        router.replace('/auth/signin');
      }
    }, [requireAuth, status, router]);
    
    // Show loading state while authentication state is being determined
    if (requireAuth && status === 'loading') {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-white">Loading...</div>
        </div>
      );
    }
    
    // Handle non-authenticated users for protected pages
    if (requireAuth && status === 'unauthenticated') {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-white">Redirecting to sign in...</div>
        </div>
      );
    }
    
    // Render the component with session data
    return <Component {...props} session={session} />;
  };
} 