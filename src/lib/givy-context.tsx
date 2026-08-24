"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./context/auth-context";
import { useItemActions } from "./context/item-actions";
import { ListProvider, useLists } from "./context/list-context";
import type { GivyContextValue } from "./context/types";

const GivyContext = createContext<GivyContextValue | null>(null);

function GivyContextBridge({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const lists = useLists();
  const itemActions = useItemActions();

  const refresh = useCallback(async () => {
    await auth.refresh();
    await lists.refresh();
  }, [auth, lists]);

  const value = useMemo<GivyContextValue>(
    () => ({ ...auth, ...lists, ...itemActions, refresh }),
    [auth, itemActions, lists, refresh],
  );

  return <GivyContext.Provider value={value}>{children}</GivyContext.Provider>;
}

/** Composition root retaining the original public provider API. */
export function GivyProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ListProvider>
        <GivyContextBridge>{children}</GivyContextBridge>
      </ListProvider>
    </AuthProvider>
  );
}

/** Backward-compatible combined application hook. */
export function useGivy() {
  const context = useContext(GivyContext);
  if (!context) throw new Error("useGivy must be used within GivyProvider");
  return context;
}

export { useAuth } from "./context/auth-context";
export { useLists } from "./context/list-context";
export { useItemActions } from "./context/item-actions";
