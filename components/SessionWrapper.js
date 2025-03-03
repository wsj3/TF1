import { useSession } from 'next-auth/react';

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
    return (
      <SessionWrapper
        fallback={requireAuth ? null : <Component {...props} session={null} />}
      >
        {(session, status) => {
          if (requireAuth && !session) {
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/signin';
              return null;
            }
            return null;
          }
          return <Component {...props} session={session} />;
        }}
      </SessionWrapper>
    );
  };
} 