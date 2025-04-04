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

// Import static export helper if available
let isStaticExport = false;
try {
  const staticExportModule = require('./static-export');
  isStaticExport = staticExportModule.IS_STATIC_EXPORT || false;
} catch (e) {
  // Module doesn't exist yet, that's ok
}

// Helper to detect static export in various ways
function checkIsStaticExport() {
  return (
    isStaticExport || 
    process.env.STATIC_EXPORT === 'true' || 
    process.env.DOCKER_BUILD === 'true' ||
    process.env.IS_EXPORT === 'true' ||
    process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build' ||
    typeof window !== 'undefined' && window.__NEXT_DATA__?.nextExport === true
  );
}

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
    // Skip actual fetching during static export to prevent errors
    if (checkIsStaticExport()) {
      console.log('[Auth] Bypassing session fetch during static export');
      setLoading(false);
      return null;
    }

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
    // Skip login during static export
    if (checkIsStaticExport()) {
      console.log('[Auth] Bypassing login during static export');
      setLoading(false);
      return false;
    }

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
    // Skip logout during static export
    if (checkIsStaticExport()) {
      console.log('[Auth] Bypassing logout during static export');
      setLoading(false);
      return false;
    }

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

  // Check session on initial load, but skip on auth pages and during static export
  useEffect(() => {
    // Skip session check entirely during static export
    if (checkIsStaticExport()) {
      console.log('[Auth] Skipping initial session check during static export');
      setLoading(false);
      return;
    }

    // Only check session on client-side, not during server-side rendering
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

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
  
  // Special handling for static export or when useAuth is used outside of AuthProvider
  if (context === undefined) {
    // Check for static export first
    if (checkIsStaticExport()) {
      console.log('[Auth] Providing mock auth context during static export');
      // Return a mock context that won't cause errors
      return {
        user: { id: 'static-user', email: 'static@example.com', name: 'Static User' },
        loading: false,
        error: null,
        login: async () => false,
        logout: async () => false,
        getSession: async () => null
      };
    }
    
    // If we're in development mode, provide a safer error that doesn't crash
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Auth] useAuth hook used outside of AuthProvider. Providing mock context for development.');
      return {
        user: null,
        loading: false,
        error: new Error('useAuth used outside of AuthProvider'),
        login: async () => { console.warn('Auth not initialized'); return false; },
        logout: async () => { console.warn('Auth not initialized'); return false; },
        getSession: async () => { console.warn('Auth not initialized'); return null; }
      };
    }
    
    // For production, still throw the error but with more context
    throw new Error('useAuth must be used within an AuthProvider. Check if the component is wrapped with AuthProvider.');
  }
  
  return context;
};

// Page component protection
export function withPageAuth(Component) {
  return function WrappedComponent(props) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    // For development, provide a mock user after a timeout
    const [devMockUser, setDevMockUser] = useState(null);

    useEffect(() => {
      setMounted(true);
      
      // In development mode, if we're still loading or no user after a delay,
      // provide a mock dev user to prevent endless loading states
      if (process.env.NODE_ENV === 'development' && (!user && !loading)) {
        const timer = setTimeout(() => {
          console.log('[withPageAuth] Using mock dev user for development');
          setDevMockUser({
            id: 'dev-user-1',
            name: 'Development User',
            email: 'dev@example.com',
            role: 'admin',
            isAdmin: true
          });
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [user, loading]);

    // Detect static export
    const isExportBuild = checkIsStaticExport();
    // Get the effective user (real user or dev mock user)
    const effectiveUser = user || devMockUser;

    // Skip authentication during static export
    if (isExportBuild) {
      console.log('[withPageAuth] Bypassing auth for static build');
      return <Component {...props} />;
    }
    
    // For development mode, bypass auth after a timeout if no user is found
    if (process.env.NODE_ENV === 'development' && devMockUser) {
      console.log('[withPageAuth] Using development mock user');
      return <Component {...props} />;
    }

    useEffect(() => {
      if (mounted && !loading && !user && !isExportBuild && !devMockUser) {
        // Only redirect if we're not in development mode or we've waited long enough
        if (process.env.NODE_ENV !== 'development' || mounted) {
          sessionStorage.setItem('redirectAfterLogin', router.asPath);
          router.push('/auth/signin');
        }
      }
    }, [user, loading, mounted, router, isExportBuild, devMockUser]);

    // Show loading state, but with a shorter timeout in development
    if ((loading || !mounted) && !isExportBuild && !devMockUser) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // Show page if user is authenticated, in development mode, or during static export
    return (isExportBuild || effectiveUser) ? <Component {...props} /> : null;
  };
}

// API route protection
export function withApiAuth(handler) {
  return async (req, res) => {
    // Skip authentication during static export
    if (checkIsStaticExport()) {
      console.log('[withApiAuth] Bypassing auth for static build');
      return handler(req, res);
    }

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