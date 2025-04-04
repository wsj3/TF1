# Safe API Pattern for Prisma and Client-Side Protection

This document outlines the safe API pattern implemented in this application to protect against Prisma client-side errors and ensure resilient API endpoints.

## Problem

When using Prisma ORM in a Next.js application, we encountered the following issues:

1. Prisma cannot run in the browser environment
2. Client-side imports of modules that use Prisma caused runtime errors
3. API endpoints could fail if database connections had issues
4. Navigation between modules was breaking due to client-side Prisma usage

## Solution

We implemented a comprehensive solution with two main components:

1. **Client-Side Protection**: Ensuring client components don't directly use Prisma
2. **Server-Side Resilience**: Making API endpoints resilient with fallbacks

### 1. Client-Side Protection

#### Safe API Helpers

We created a utility called `apiHelpers.js` with safe wrapper functions for all API calls:

```javascript
// utils/apiHelpers.js
export async function safeFetch(url, options = {}) {
  try {
    // Implementation with error handling
  } catch (error) {
    // Return standardized error response
  }
}

// Example of a specific API helper
export async function fetchBillingApi(params = {}) {
  // Always include demo=true as a fallback
  // Implementation details
  return safeFetch(url);
}
```

#### Dynamic Imports

For components that might indirectly use Prisma, we use dynamic imports with SSR disabled:

```javascript
import dynamic from 'next/dynamic';
// Import AIAssistant dynamically to prevent client-side Prisma issues
const AIAssistant = dynamic(() => import('../components/AIAssistant'), { ssr: false });
```

### 2. Server-Side Resilience

#### Safe API Endpoint Pattern

We created a higher-order function to wrap API handlers with error handling and demo fallbacks:

```javascript
// utils/apiHelpers.js
export function createSafeApiEndpoint(handler, getDemoData) {
  return async (req, res) => {
    // Initialize Prisma with singleton pattern
    // Handle errors with demo data fallbacks
    // Proper resource cleanup
  };
}
```

#### Demo Data Fallbacks

Every API endpoint includes demo data generation for fallbacks:

```javascript
function getDemoData() {
  // Return mock data that resembles real data structure
  return {
    success: true,
    data: [...mockItems],
    message: 'Demo data retrieved successfully'
  };
}

export default createSafeApiEndpoint(endpointHandler, getDemoData);
```

## Implementation Guide

### Creating New API Endpoints

1. Copy `pages/api/template-endpoint.js` as a starting point
2. Customize the handler functions for your specific data model
3. Update the demo data generation function with relevant mock data
4. Export using the `createSafeApiEndpoint` wrapper

### Creating Client-Side Components

1. Never import Prisma directly in client components
2. Use dynamic imports for components that might use Prisma
3. Always use the safe API helpers from `utils/apiHelpers.js`
4. Add proper error handling in components

### Modifying Existing API Endpoints

1. Convert direct Prisma usage to use the singleton pattern
2. Implement demo data fallbacks
3. Wrap the handler with `createSafeApiEndpoint`
4. Update client components to use safe API helpers

## Best Practices

1. **Always include demo mode**: API endpoints should always support a `demo=true` parameter
2. **Standardized responses**: All API responses should follow the same structure
3. **Graceful degradation**: UIs should handle API failures gracefully
4. **Safe singleton pattern**: Use global Prisma instances to avoid connection limits
5. **Proper error handling**: Both client and server should handle errors appropriately

By following this pattern, we ensure that:
- The application remains functional even if the database is unavailable
- Client-side components never try to use Prisma directly
- Navigation between modules works smoothly
- Development and testing can proceed with demo data when needed

## Example Usage

### API Endpoint
```javascript
import { createSafeApiEndpoint } from '../../utils/apiHelpers';

async function endpointHandler(req, res, prisma) {
  // Implementation
}

function getDemoData() {
  // Demo data
}

export default createSafeApiEndpoint(endpointHandler, getDemoData);
```

### Client Component
```javascript
import { fetchSessionsApi } from '../utils/apiHelpers';

function Sessions() {
  useEffect(() => {
    async function fetchData() {
      const result = await fetchSessionsApi();
      if (result.success) {
        // Handle success
      } else {
        // Handle error
      }
    }
    fetchData();
  }, []);
  
  // Component implementation
}
``` 