"use client";

import { getSession2 } from "@/server/session/getSession.action";
import { SessionData } from "@/server/session/session";
import { useState, useEffect } from "react";

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const sessionData = await getSession2();
        setSession(sessionData);
      } catch (error) {
        console.error("Error getting session:", error);
      }
    }

    fetchSession();
  }, []);

  return session;
}