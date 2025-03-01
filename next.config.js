/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable image optimization
  images: {
    domains: ['localhost'],
  },
  // Environment variables accessible on the client
  env: {
    APP_NAME: 'Therapists Friend',
    APP_VERSION: '0.1.0',
  },
  // Optimize for serverless environments
  experimental: {
    // This can improve serverless function initialization
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Disable webpack processing that requires tailwindcss
  webpack: (config) => {
    // Find the rule that uses postcss-loader
    const rules = config.module.rules.find((rule) => rule.oneOf)?.oneOf || [];
    
    // Modify the rule to skip tailwindcss
    rules.forEach((rule) => {
      if (rule.use?.loader?.includes('postcss-loader')) {
        if (!rule.use.options) rule.use.options = {};
        if (!rule.use.options.postcssOptions) rule.use.options.postcssOptions = {};
        
        // Replace any tailwind plugins with empty functions
        if (rule.use.options.postcssOptions.plugins) {
          rule.use.options.postcssOptions.plugins = 
            rule.use.options.postcssOptions.plugins.map(plugin => {
              if (typeof plugin === 'string' && plugin.includes('tailwind')) {
                return () => ({ plugins: [] });
              }
              return plugin;
            });
        }
      }
    });

    return config;
  },
}

module.exports = nextConfig 