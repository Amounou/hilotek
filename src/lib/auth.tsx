import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "super_admin"
  | "admin"
  | "technician"
  | "cashier"
  | "commercial"
  | "warehouse"
  | "writer"
  | "support"
  | "customer";

type Ctx = {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (r: AppRole) => boolean;
  hasAny: (rs: AppRole[]) => boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  };

  useEffect(() => {
    // set listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadRoles(s.user.id), 0);
      } else {
        setRoles([]);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadRoles(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const refreshRoles = async () => {
    if (user) await loadRoles(user.id);
  };

  const hasRole = (r: AppRole) => roles.includes(r);
  const hasAny = (rs: AppRole[]) => rs.some((r) => roles.includes(r));

  return (
    <AuthCtx.Provider
      value={{
        user,
        session,
        roles,
        loading,
        isAuthenticated: !!user,
        hasRole,
        hasAny,
        signOut,
        refreshRoles,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const STAFF_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "technician",
  "cashier",
  "commercial",
  "warehouse",
  "writer",
  "support",
];
