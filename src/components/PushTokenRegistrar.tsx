"use client";

import { useEffect, useRef } from "react";
import { registerPushToken } from "@/lib/api/event-notifications";
import { useGivy } from "@/lib/givy-context";

type Platform = "android" | "ios" | "web";

declare global {
  interface Window {
    __GIVY_FCM_TOKEN__?: string;
    __GIVY_FCM_PLATFORM__?: Platform;
  }
}

/**
 * Registers an FCM device token injected by the Flutter Play shell
 * (window.__GIVY_FCM_TOKEN__ / givy-fcm-token event). No-op on plain browsers.
 */
export function PushTokenRegistrar() {
  const { user, cloud } = useGivy();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !cloud) return;

    async function tryRegister(token: string, platform: Platform) {
      const t = token.trim();
      if (t.length < 10 || last.current === t) return;
      try {
        await registerPushToken(t, platform);
        last.current = t;
      } catch {
        /* ignore — cron still writes in-app reminders */
      }
    }

    const existing = window.__GIVY_FCM_TOKEN__;
    if (existing) {
      void tryRegister(existing, window.__GIVY_FCM_PLATFORM__ ?? "android");
    }

    const onToken = (ev: Event) => {
      const detail = (ev as CustomEvent<{ token?: string; platform?: Platform }>)
        .detail;
      const token = detail?.token ?? window.__GIVY_FCM_TOKEN__;
      if (!token) return;
      void tryRegister(token, detail?.platform ?? "android");
    };

    window.addEventListener("givy-fcm-token", onToken);
    return () => window.removeEventListener("givy-fcm-token", onToken);
  }, [user, cloud]);

  return null;
}
