import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

type AuthState = {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, isAdmin: false, loading: true });

async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", userId).single();
  return !!data?.is_admin;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, isAdmin: false, loading: true });

  useEffect(() => {
    let cancelled = false;

    async function update(session: Session | null) {
      const isAdmin = session ? await fetchIsAdmin(session.user.id) : false;
      if (!cancelled) setState({ session, isAdmin, loading: false });
    }

    supabase.auth.getSession().then(({ data }) => update(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Run outside the auth callback so Supabase isn't called re-entrantly.
      setTimeout(() => update(session), 0);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useUserId(): string {
  const { session } = useAuth();
  if (!session) throw new Error("useUserId called while signed out");
  return session.user.id;
}

/** True for accounts with is_admin set. The database enforces this too. */
export function useIsAdmin(): boolean {
  return useAuth().isAdmin;
}
