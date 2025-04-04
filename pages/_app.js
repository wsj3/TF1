import '../styles/globals.css';
import { AuthProvider } from '../utils/auth';

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

function MyApp({ Component, pageProps }) {
  // If in static export, don't wrap with AuthProvider to avoid client-side issues
  if (checkIsStaticExport()) {
    console.log('[_app] Rendering without AuthProvider during static export');
    return <Component {...pageProps} />;
  }

  // Normal rendering with auth for client-side and server-side rendering
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp; 