import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Declare global variable for static export detection
declare global {
  var isStaticExport: boolean | undefined;
}

export function middleware(request: NextRequest) {
  try {
    // Enhanced detection for static export/build environment
    const isStaticBuild = 
      process.env.STATIC_EXPORT === 'true' || 
      global.isStaticExport === true ||
      process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build' ||
      // Detect static generation by checking for missing request features
      !request.cookies || typeof request.cookies.get !== 'function' ||
      // Always skip during Docker build
      process.env.DOCKER_BUILD === 'true';

    // Early return for all static builds/exports
    if (isStaticBuild) {
      // Set global flag for future middleware calls
      if (typeof global.isStaticExport === 'undefined') {
        global.isStaticExport = true;
        console.log('Static export detected, bypassing authentication middleware');
      }
      return NextResponse.next();
    }

    // Get the pathname of the request
    const path = request.nextUrl.pathname;

    // Skip auth check for public paths
    if (
      path.startsWith('/auth/') ||  // Auth pages
      path.startsWith('/_next/') ||  // Next.js resources
      path.startsWith('/api/auth/') ||  // Auth API routes
      path.startsWith('/api/') ||   // Skip all API routes during build
      path === '/favicon.ico' ||
      path === '/' ||  // Homepage
      path === '/404'   // Error page
    ) {
      return NextResponse.next();
    }

    // Safely check for auth token with improved error handling
    let authToken = null;
    try {
      if (request.cookies && typeof request.cookies.get === 'function') {
        const authCookie = request.cookies.get('auth_token');
        const tfAuthCookie = request.cookies.get('tf-auth-token');
        authToken = authCookie?.value || tfAuthCookie?.value;
      }
    } catch (e) {
      // If there's any error reading cookies, just continue without auth
      console.warn('Error reading auth cookies:', e);
      return NextResponse.next();
    }

    // If no token found, redirect to login
    if (!authToken) {
      const loginUrl = new URL('/auth/simple-signin', request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    // If any error occurs in the middleware, log it and continue without auth
    console.error('Auth middleware error:', error);
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