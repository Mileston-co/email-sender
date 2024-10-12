import { SessionOptions } from "iron-session";

export interface SessionData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isGmailConnected?: boolean;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "mileston-email-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 2),
  },
};