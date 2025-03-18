// Custom authentication utilities
import { useState, useEffect, createContext, useContext } from 'react';
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
        return data.user;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error("Failed to get session", err);
      setError(err);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Function to login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await getSession(); // Refresh the session
        return true;
      } else {
        setError(data.error || 'Login failed');
        return false;
      }
    } catch (err) {
      console.error("Login error", err);
      setError(err.message || 'An error occurred during login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to logout user
  const logout = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        setUser(null);
        Router.push('/auth/signin');
        return true;
      } else {
        const data = await res.json();
        setError(data.error || 'Logout failed');
        return false;
      }
    } catch (err) {
      console.error("Logout error", err);
      setError(err.message || 'An error occurred during logout');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check session on initial load
  useEffect(() => {
    getSession();
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    getSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC to protect pages
export const withAuth = (Component) => {
  const WithAuth = (props) => {
    const { user, loading } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    // Check if user is authenticated
    useEffect(() => {
      if (mounted && !loading && !user) {
        Router.push('/auth/signin');
      }
    }, [user, loading, mounted]);

    // Show nothing while loading or redirecting
    if (loading || !mounted || !user) {
      return null;
    }

    // If authenticated, render the component
    return <Component {...props} />;
  };

  WithAuth.displayName = `WithAuth(${Component.displayName || Component.name || 'Component'})`;
  return WithAuth;
};

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