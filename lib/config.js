// Iron Session configuration
export const ironOptions = {
  cookieName: 'tf-auth-token',
  password: process.env.JWT_SECRET || 'development-secret-at-least-32-characters-long-for-iron-session-security',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8, // 8 hours
    httpOnly: true
  }
};

// Other application configuration can go here 