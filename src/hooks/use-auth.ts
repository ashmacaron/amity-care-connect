import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  role: "patient" | "doctor" | null;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true, userId: null, email: null, role: null
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setState({ loading: false, userId: null, email: null, role: null });
        return;
      }
      // Read role from user_metadata set during signup
      const role = (user.user_metadata?.role === "doctor" ? "doctor" : "patient") as "doctor" | "patient";
      if (mounted) setState({ loading: false, userId: user.id, email: user.email ?? null, role });
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  return state;
}

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!auth.loading && !auth.userId) router.navigate({ to: "/login" });
  }, [auth.loading, auth.userId, router]);
  return auth;
}
