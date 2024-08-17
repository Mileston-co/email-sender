"use server";

import {
  sessionOptions,
  SessionData,
  defaultSession,
} from "@/server/session/session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

const getSession = async () => {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
  }

  return session;
};

export default getSession;

export const getSession2 = async () => {
  const session = await getSession();

  // Convert session to a plain object
  const plainSession = JSON.parse(JSON.stringify(session));

  if (!plainSession.isLoggedIn) {
    plainSession.isLoggedIn = defaultSession.isLoggedIn;
  }

  return plainSession;
};
