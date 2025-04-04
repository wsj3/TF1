export const sessionOptions = {
  cookieName: "therapistfriend_session",
  password: process.env.SESSION_SECRET || "development_secret_at_least_32_characters",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: "lax",
  },
}; 