// Custom authentication utilities
import { useState, useEffect, createContext, useContext } from 'react';
import Router from 'next/router';
import { getIronSession } from 'iron-session';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { PrismaClient } from '@prisma/client';
import cookie from 'cookie';
import { useRouter } from 'next/router';

const prisma = new PrismaClient();

// Create auth context
const AuthContext = createContext();

// Auth configuration
export const authConfig = {
  cookieName: 'auth_token',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-key',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
    maxAge: 24 * 60 * 60 // 24 hours
  }
};

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
        if (data.user) {
          setUser(data.user);
          return data.user;
        } else {
          setUser(null);
          return null;
        }
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

  // Check session on initial load, but skip on auth pages
  useEffect(() => {
    const path = window.location.pathname;
    if (!path.startsWith('/auth/')) {
      getSession();
    } else {
      setLoading(false);
    }
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

// Page component protection
export function withPageAuth(Component) {
  return function WrappedComponent(props) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (mounted && !loading && !user) {
        sessionStorage.setItem('redirectAfterLogin', router.asPath);
        router.push('/auth/signin');
      }
    }, [user, loading, mounted, router]);

    // Show loading state
    if (loading || !mounted) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // Show page if user is authenticated
    return user ? <Component {...props} /> : null;
  };
}

// API route protection
export function withApiAuth(handler) {
  return async (req, res) => {
    try {
      const cookies = parse(req.headers.cookie || '');
      const token = cookies[authConfig.cookieName];

      if (!token) {
        console.log('No auth token found');
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - No token found'
        });
      }

      const userData = jwt.verify(token, authConfig.jwtSecret);
      
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
        select: {
          id: true,
          email: true,
          role: true,
          isAdmin: true,
          status: true,
          name: true
        }
      });

      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - Invalid user'
        });
      }

      req.user = user;
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
  };
}

// Use withApiAuth for API routes and withPageAuth for pages
export const withAuth = (handler) => {
  // If it's a React component
  if (typeof handler === 'function' && handler.name) {
    return withPageAuth(handler);
  }
  // If it's an API route handler
  return withApiAuth(handler);
};

// Get session on server side
export async function getServerSideSession(req) {
  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[authConfig.cookieName];
    
    if (!token) {
      return null;
    }
    
    // Verify token
    const userData = jwt.verify(token, authConfig.jwtSecret);
    
    if (!userData) {
      return null;
    }
    
    return {
      user: {
        id: userData.userId,
        email: userData.email,
        role: userData.role,
        isAdmin: userData.isAdmin
      }
    };
  } catch (error) {
    console.error('Get server side session error:', error);
    return null;
  }
}

/**
 * Middleware to check if user is authenticated
 * @param {Request} req - The request object
 * @returns {Response|undefined} - Redirects to login if not authenticated
 */
export async function authMiddleware(req) {
  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[authConfig.cookieName];

    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Verify token
    try {
      const userData = jwt.verify(token, authConfig.jwtSecret);
      if (!userData) {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
}

// Function to clear auth cookies
export function clearAuthCookies(res) {
  res.setHeader('Set-Cookie', [
    cookie.serialize('auth_token', '', {
      maxAge: -1,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.therapistsfriend.com' : 'localhost'
    }),
    cookie.serialize('auth', '', {
      maxAge: -1,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.therapistsfriend.com' : 'localhost'
    })
  ]);
} 