// Mock implementation of tailwindcss
// This is used to satisfy imports during the build process

module.exports = {
  // Core functionality that might be imported
  config: {},
  plugin: () => {},
  
  // Functions that might be called
  createContext: () => ({
    theme: () => ({}),
    config: {},
    e: (selector) => selector,
    prefix: (selector) => selector,
    variants: () => ({}),
  }),
  
  // Factory function that Next.js might try to call
  default: function() {
    return {
      handler: () => {},
      plugins: [],
    };
  },
  
  // Additional exports that PostCSS might try to use
  postcss: {
    process: () => ({ css: '' }),
  },
  
  // In case it's used as a postcss plugin
  postcssPlugin: 'tailwindcss',
  Once: () => {},
  Root: () => {},
  prepare: () => ({
    Once: () => {},
    Root: () => {},
  }),
}; 