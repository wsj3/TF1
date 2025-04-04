/**
 * Static Export Utilities
 * 
 * This file provides utilities for detecting and handling static export environments.
 * It is created by next.config.js during the export process and available
 * throughout the application to help components bypass authentication and API calls.
 */

// Constants for static export detection
export const IS_STATIC_EXPORT = true;
export const STATIC_EXPORT_MARKER = '.static-export-marker';

/**
 * Check if the current execution context is a static export
 * Uses multiple signals to detect static export environment
 */
export function isStaticExport() {
  return (
    // Various environment signals
    IS_STATIC_EXPORT === true ||
    process.env.STATIC_EXPORT === 'true' || 
    process.env.DOCKER_BUILD === 'true' ||
    process.env.IS_EXPORT === 'true' ||
    process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build' ||
    // Client-side detection
    typeof window !== 'undefined' && window.__NEXT_DATA__?.nextExport === true
  );
}

/**
 * Safe authentication check - returns true if the check should be bypassed
 * This provides a unified way to skip auth in various components
 */
export function shouldSkipAuthCheck() {
  return isStaticExport();
}

/**
 * Check if the current page is being statically rendered
 * This is useful in getStaticProps to determine if data fetching should be skipped
 */
export function isStaticRender() {
  return isStaticExport();
}

/**
 * A mock user object that can be used during static export
 * This ensures components don't crash when they need a user object
 */
export const mockUser = {
  id: 'static-user',
  email: 'static@example.com',
  name: 'Static User',
  role: 'user',
  isAdmin: false
};