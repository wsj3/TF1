import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip auth checks entirely during static export/build
  if (process.env.STATIC_EXPORT === 'true' || 
      process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
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
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check for auth token (check both possible cookie names)
  const authToken = request.cookies.get('auth_token') || request.cookies.get('tf-auth-token');

  // If no token found, redirect to login
  if (!authToken) {
    const loginUrl = new URL('/auth/simple-signin', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
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