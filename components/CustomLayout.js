import Head from 'next/head';
import { useAuth } from '../utils/auth';
import Sidebar from './Sidebar';
import CustomTopNav from './CustomTopNav';
import { useState, useEffect } from 'react';

// Mock user for development
const MOCK_DEV_USER = {
  id: 'dev-user-1',
  name: 'Development User',
  email: 'dev@example.com',
  role: 'admin',
  isAdmin: true
};

// Import static export helper if available
let isStaticExport = false;
try {
  const staticExportModule = require('../utils/static-export');
  isStaticExport = staticExportModule.IS_STATIC_EXPORT || false;
} catch (e) {
  // Module doesn't exist yet, that's ok
}

// Helper to detect static export in various ways
function checkIsStaticExport() {
  // Development check - never consider localhost as static export
  const isDevelopment = 
    process.env.NODE_ENV === 'development' ||
    (typeof window !== 'undefined' && (
      window.location.port === '3000' || 
      window.location.port === '3001' || 
      window.location.hostname.includes('localhost')
    ));
  
  if (isDevelopment) {
    return false;
  }
  
  return (
    isStaticExport || 
    process.env.STATIC_EXPORT === 'true' || 
    process.env.DOCKER_BUILD === 'true' ||
    process.env.IS_EXPORT === 'true' ||
    process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build' ||
    typeof window !== 'undefined' && window.__NEXT_DATA__?.nextExport === true
  );
}

export default function CustomLayout({ children, title = 'Therapist\'s Friend' }) {
  const { user } = useAuth();
  const isDev = process.env.NODE_ENV === 'development';
  
  // Use mock user in development mode if no user is available
  const effectiveUser = isDev ? (user || MOCK_DEV_USER) : user;
  const isAuthenticated = !!effectiveUser;
  
  const isExport = checkIsStaticExport();
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // During static export, always render content without authentication checks
  if (isExport) {
    console.log('[CustomLayout] Static export detected, bypassing auth checks');
    return (
      <div className="min-h-screen bg-gray-900">
        <Head>
          <title>{title}</title>
          <meta name="description" content="Therapist's Friend - Practice Management" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        {/* Skip sidebar and topnav during export */}
        <main className="min-h-screen bg-gray-900">
          {children}
        </main>
      </div>
    );
  }

  // In development mode, or if authenticated, show the full layout
  if (isDev || isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Head>
          <title>{title}</title>
          <meta name="description" content="Therapist's Friend - Practice Management" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Always show navigation in development or when user is authenticated */}
        <Sidebar />
        <CustomTopNav />

        {/* Main Content */}
        <main className="ml-64 pt-16 min-h-screen bg-gray-900">
          {children}
        </main>
      </div>
    );
  }

  // Only show loading in production when not authenticated
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Checking authentication status...</div>
    </div>
  );
} 