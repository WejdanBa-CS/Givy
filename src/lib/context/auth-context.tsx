"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchSessionUser,
  isSupabaseConfigured,
  requestPasswordReset as requestPasswordResetRemote,
  signInWithEmail as signInWithEmailRemote,
  signInWithOAuth,
  signOutRemote,
  signUpWithEmail as signUpWithEmailRemote,
  updatePassword as updatePasswordRemote,
  type EmailAuthResult,
} from "@/lib/api";
import { clearGuestCookie, isGuestAllowed, isGuestUser, setGuestCookie } from "@/lib/guest";
import {
  getCurrentUser,
  signIn as signInLocal,
  signInWithEmailLocal,
  signOut as signOutLocal,
} from "@/lib/store";
import type { AuthProvider, User } from "@/lib/types";
import type { AuthContextValue } from "./types";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const cloud = isSupabaseConfigured();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const localSession = !cloud || isGuestUser(user);

  const refresh = useCallback(async () => {
    const localUser = getCurrentUser();
    if (isGuestUser(localUser)) {
      setGuestCookie();
      setUser(localUser);
      return;
    }

    if (cloud) {
      const remoteUser = await fetchSessionUser();
      if (remoteUser) {
        clearGuestCookie();
        signOutLocal();
        setUser(remoteUser);
        return;
      }
      setUser(null);
      return;
    }

    setUser(localUser);
  }, [cloud]);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } finally {
        setReady(true);
      }
    })();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      cloud,
      localSession,
      user,
      refresh,
      signIn: async (provider: AuthProvider, next = "/app") => {
        if (provider === "guest") {
          if (!isGuestAllowed()) {
            throw new Error("Guest mode is disabled for this environment.");
          }
          if (cloud) {
            try {
              await signOutRemote();
            } catch {
              // Guest mode does not require an existing cloud session to clear.
            }
          }
          signInLocal("guest");
          setGuestCookie();
          await refresh();
          return;
        }

        if (cloud) {
          if (provider === "apple") {
            throw new Error("Apple sign-in comes next. Use Google or Facebook for now.");
          }
          if (provider === "email") {
            throw new Error("Use the email form to sign in with email.");
          }
          clearGuestCookie();
          signOutLocal();
          await signInWithOAuth(provider, next);
          return;
        }

        clearGuestCookie();
        signInLocal(provider);
        await refresh();
      },
      signInWithEmail: async (email: string, password: string) => {
        clearGuestCookie();
        if (cloud) {
          signOutLocal();
          await signInWithEmailRemote(email, password);
          await refresh();
          return;
        }
        signInWithEmailLocal(email, password, "signin");
        await refresh();
      },
      requestPasswordReset: async (email: string) => {
        if (!cloud) {
          throw new Error("Password reset is available when Supabase authentication is configured.");
        }
        await requestPasswordResetRemote(email);
      },
      updatePassword: async (password: string) => {
        if (!cloud) {
          throw new Error("Password updates are available when Supabase authentication is configured.");
        }
        await updatePasswordRemote(password);
        await refresh();
      },
      signUpWithEmail: async (
        email: string,
        password: string,
        displayName?: string,
      ): Promise<EmailAuthResult> => {
        clearGuestCookie();
        if (cloud) {
          signOutLocal();
          const result = await signUpWithEmailRemote(email, password, displayName);
          if (!result.needsEmailConfirm) await refresh();
          return result;
        }
        signInWithEmailLocal(email, password, "signup", displayName);
        await refresh();
        return {};
      },
      signOut: async () => {
        clearGuestCookie();
        signOutLocal();
        if (cloud) await signOutRemote();
        await refresh();
      },
    }),
    [cloud, localSession, ready, refresh, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
