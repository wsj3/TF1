/**
 * This file provides utilities for detecting static exports in different contexts
 */

// Check multiple possible indicators of a static export/build
export const IS_STATIC_EXPORT = 
  process.env.STATIC_EXPORT === 'true' || 
  process.env.DOCKER_BUILD === 'true' ||
  process.env.IS_EXPORT === 'true' ||
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NODE_ENV === 'production' ||
  typeof window === 'undefined';  // SSR context

/**
 * Use this function to check if we're in a static export context
 * This centralizes the detection logic across the app
 */
export function isStaticExport() {
  return IS_STATIC_EXPORT;
}

// For use with getStaticProps to exclude pages from static generation
export async function getStaticPropsWithNoGeneration() {
  return {
    notFound: true // This prevents the page from being pre-rendered
  };
} 