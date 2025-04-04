import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Declare global variable for static export detection
declare global {
  var isStaticExport: boolean | undefined;
}

// Set global flag early to ensure it's available throughout the application
if (
  typeof global.isStaticExport === 'undefined' && 
  (process.env.STATIC_EXPORT === 'true' || 
   process.env.DOCKER_BUILD === 'true' ||
   process.env.IS_EXPORT === 'true' ||
   process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build')
) {
  global.isStaticExport = true;
  console.log('[middleware] Setting global.isStaticExport = true');
}

/**
 * Checks if the current context is a static export
 * This function is duplicated from utils/static-export.js since imports are not allowed in middleware
 */
function isStaticExport() {
  return (
    // Global flag set above
    global.isStaticExport === true ||
    // Environment variables
    process.env.STATIC_EXPORT === 'true' || 
    process.env.DOCKER_BUILD === 'true' ||
    process.env.IS_EXPORT === 'true' ||
    // Build phase detection
    process.env.NODE_ENV === 'production' && 
    process.env.NEXT_PHASE === 'phase-production-build'
  );
}

export function middleware(request: NextRequest) {
  try {
    // Force skip for all static exports - highest priority check
    if (isStaticExport()) {
      console.log('[middleware] Bypassing auth - static export environment detected');
      return NextResponse.next();
    }

    // CRITICAL: Early check for static generation by testing if request is properly formed
    if (!request || !request.cookies || typeof request.cookies.get !== 'function') {
      console.log('[middleware] Bypassing auth - detected static generation (no cookies)');
      return NextResponse.next();
    }

    // Get the pathname of the request
    const path = request.nextUrl.pathname;

    // Skip auth check for public paths
    if (
      path.startsWith('/auth/') ||  // Auth pages
      path.startsWith('/_next/') ||  // Next.js resources
      path.startsWith('/api/') ||   // Skip all API routes during build
      path === '/favicon.ico' ||
      path === '/' ||  // Homepage
      path === '/404'   // Error page
    ) {
      return NextResponse.next();
    }

    // Safely check for auth token with improved error handling
    try {
      const authCookie = request.cookies.get('auth_token');
      const tfAuthCookie = request.cookies.get('tf-auth-token');
      const authToken = authCookie?.value || tfAuthCookie?.value;

      // If no token found, redirect to login
      if (!authToken) {
        const loginUrl = new URL('/auth/simple-signin', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch (e) {
      // If any error occurs reading cookies, just continue without auth
      console.warn('[middleware] Error reading auth cookies:', e);
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    // If any error occurs in the middleware, log it and continue without auth
    console.error('[middleware] Auth middleware error:', error);
    return NextResponse.next();
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (authentication API routes)
     * 2. /_next/* (Next.js internals)
     * 3. /static/* (static files)
     * 4. /favicon.ico, /sitemap.xml (public files)
     */
    '/((?!api/auth|_next|static|favicon.ico|sitemap.xml).*)',
  ],
}; 