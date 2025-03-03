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
        router.push('/auth/signin');
      }
    }, [requireAuth, status, router]);
    
    // Show loading state for protected pages
    if (requireAuth && status === 'loading') {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-white">Loading...</div>
        </div>
      );
    }
    
    // Redirect to sign in for protected pages
    if (requireAuth && status === 'unauthenticated') {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-white">Redirecting to sign in...</div>
        </div>
      );
    }
    
    return <Component {...props} session={session} />;
  };
} 