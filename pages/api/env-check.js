// An endpoint to check environment variables and runtime info
export default function handler(req, res) {
  // Collect environment information
  const envInfo = {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    nextVersion: process.env.NEXT_RUNTIME || 'unknown',
    timestamp: new Date().toISOString(),
    hasEnvVars: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NODE_ENV: !!process.env.NODE_ENV,
    },
    vercelRegion: process.env.VERCEL_REGION || null,
    system: {
      platform: process.platform,
      arch: process.arch,
      cpus: process.env.VERCEL_CPU_CORES || 'unknown',
      memory: process.env.VERCEL_MEMORY || 'unknown',
    },
    headers: req.headers,
  };

  // Hide sensitive header information
  if (envInfo.headers.authorization) {
    envInfo.headers.authorization = '[REDACTED]';
  }
  if (envInfo.headers.cookie) {
    envInfo.headers.cookie = '[REDACTED]';
  }

  res.status(200).json(envInfo);
} 