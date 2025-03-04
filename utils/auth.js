// Custom authentication utilities
import { useState, useEffect, createContext, useContext } from 'react';
import { parse } from 'cookie';
import Router from 'next/router';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to get current session
  const getSession = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to get session', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.error || 'Login failed');
        return { 
          success: false, 
          error: data.error || 'Login failed' 
        };
      }
    } catch (err) {
      console.error('Login error', err);
      setError('An unexpected error occurred');
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout');
      setUser(null);
      Router.push('/');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  // Check session on mount and when cookies change
  useEffect(() => {
    getSession();
  }, []);

  // Create auth value object
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    getSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth
export function useAuth() {
  return useContext(AuthContext);
}

// HOC to protect routes
export function withAuth(Component) {
  const AuthenticatedComponent = (props) => {
    const { user, loading } = useAuth();
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
      setMounted(true);
    }, []);

    // Don't render anything until the component is mounted on the client
    if (!mounted) return null;
    
    // Show loading indicator
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      );
    }
    
    // Redirect to login if not authenticated
    if (!user) {
      if (typeof window !== 'undefined') {
        Router.replace('/auth/simple-signin');
      }
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white">Redirecting to sign in...</div>
        </div>
      );
    }
    
    // Render the component if authenticated
    return <Component {...props} user={user} />;
  };
  
  return AuthenticatedComponent;
}

// Get session on server side
export async function getServerSideSession(req) {
  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;
    
    if (!token) {
      return null;
    }
    
    // Decode the token
    const userData = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token is expired
    if (userData.exp < Date.now()) {
      return null;
    }
    
    return {
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    };
  } catch (error) {
    console.error('Get server side session error:', error);
    return null;
  }
} 