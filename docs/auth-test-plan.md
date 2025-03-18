# Authentication System Test Plan

## Overview
This document outlines the test plan for verifying the new custom authentication system that replaces NextAuth.js. The test plan ensures that all authentication-related functionality works correctly before deploying to production.

## Test Environments
- **Local Development**: Test on Windows local dev environment
- **Staging**: Test on staging environment before production deployment
- **Production**: Verification after deployment

## Pre-Deployment Testing

### 1. Authentication Flow Tests

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| User Login | Attempt to log in with valid credentials | Login successful, redirected to dashboard |  |
| Failed Login | Attempt to log in with invalid credentials | Login fails, error message displayed |  |
| Logout | Log out from an authenticated session | Session terminated, redirected to login page |  |
| Session Persistence | Log in, close browser, reopen site | User should remain logged in if within token expiry |  |
| Token Expiry | Wait for token to expire | User should be prompted to login again |  |

### 2. Protected Routes Tests

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| Access Dashboard Authenticated | Visit dashboard page while authenticated | Page loads successfully |  |
| Access Dashboard Unauthenticated | Visit dashboard page while not authenticated | Redirected to login page |  |
| Access Profile Authenticated | Visit profile page while authenticated | Page loads successfully |  |
| Access Profile Unauthenticated | Visit profile page while not authenticated | Redirected to login page |  |
| Access Clients Authenticated | Visit clients page while authenticated | Page loads successfully |  |
| Access Clients Unauthenticated | Visit clients page while not authenticated | Redirected to login page |  |
| Access Tasks Authenticated | Visit tasks page while authenticated | Page loads successfully |  |
| Access Tasks Unauthenticated | Visit tasks page while not authenticated | Redirected to login page |  |
| Access Appointments Authenticated | Visit appointments page while authenticated | Page loads successfully |  |
| Access Appointments Unauthenticated | Visit appointments page while not authenticated | Redirected to login page |  |
| Access Sessions Authenticated | Visit sessions page while authenticated | Page loads successfully |  |
| Access Sessions Unauthenticated | Visit sessions page while not authenticated | Redirected to login page |  |
| Access Billing Authenticated | Visit billing page while authenticated | Page loads successfully |  |
| Access Billing Unauthenticated | Visit billing page while not authenticated | Redirected to login page |  |
| Access Diagnosis Authenticated | Visit diagnosis page while authenticated | Page loads successfully |  |
| Access Diagnosis Unauthenticated | Visit diagnosis page while not authenticated | Redirected to login page |  |

### 3. Authentication API Tests

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| API Health Check | Check if auth API is accessible | API returns 200 OK status |  |
| Token Generation | Request a new auth token | Valid JWT token returned |  |
| Token Validation | Validate an existing token | Token validation succeeds |  |
| Invalid Token | Validate an invalid token | Token validation fails |  |
| User Info Retrieval | Get user information with valid token | User data retrieved successfully |  |

### 4. Integration Tests

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| Form Submission | Submit a form on a protected page | Form submits successfully with auth token |  |
| API Request | Make an API request requiring authentication | Request succeeds with auth token |  |
| Page Navigation | Navigate between protected pages | Navigation works without re-authentication |  |
| Role-Based Access | Test access with different user roles | Access granted/denied based on role |  |

### 5. Edge Case Tests

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| Concurrent Sessions | Log in from multiple browsers/devices | All sessions should work independently |  |
| Network Interruption | Temporarily disable network during authenticated session | Session resumes when network is restored |  |
| Browser Storage Clear | Clear localStorage/cookies during session | User should be prompted to login again |  |
| XSS Protection | Test for XSS vulnerabilities in auth token handling | No XSS vulnerabilities present |  |
| CSRF Protection | Test for CSRF vulnerabilities | No CSRF vulnerabilities present |  |

## Post-Deployment Verification

| Step | Description | Expected Result | Status |
|------|-------------|-----------------|--------|
| Smoke Test | Quick verification of core auth functionality | All core functionality works |  |
| Login Monitoring | Monitor login success/failure rates | Rates should be consistent with historical data |  |
| Error Monitoring | Check for auth-related errors in logs | No unexpected errors |  |
| Performance | Measure auth-related performance | Similar or better than previous system |  |
| User Feedback | Collect user feedback on auth experience | No negative feedback related to auth |  |

## Rollback Criteria

The following conditions would trigger a rollback:

1. Authentication success rate drops below 95%
2. Multiple users report inability to log in
3. Protected routes become accessible without authentication
4. Critical functionality broken on authenticated pages
5. Significant performance degradation in authentication processes

## Test Data

### Test User Accounts

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| admin@example.com | ******** | Admin | Administrative access |
| user@example.com | ******** | User | Standard user access |
| demo@therapistsfriend.com | demo123 | Demo | Demo account |

## Execution Plan

1. Run automated tests using `scripts/test-auth.js`
2. Perform manual testing in local environment
3. Deploy to staging and repeat tests
4. Get sign-off from QA team
5. Deploy to production
6. Perform post-deployment verification

## Reporting

Document test results in the following format:

```
Test Case: [Name]
Environment: [Local/Staging/Production]
Tester: [Name]
Date: [YYYY-MM-DD]
Result: [Pass/Fail]
Notes: [Any observations or issues]
```

## Appendix: Automated Test Commands

Run authentication tests:
```bash
node scripts/test-auth.js
```

Run end-to-end tests:
```bash
npm run test:e2e
``` 