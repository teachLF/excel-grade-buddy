import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type ProfileState = {
  approved: boolean;
  isAdmin: boolean;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    (async () => {
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("approved").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (cancelled) return;
      setProfile({
        approved: !!p?.approved,
        isAdmin: (roles ?? []).some((r) => r.role === "admin"),
      });
      setProfileLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refreshProfile = async () => {
    if (!userId) return;
    const [{ data: p }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("approved").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile({
      approved: !!p?.approved,
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
    });
  };

  return {
    session,
    user: session?.user ?? null,
    loading: loading || profileLoading,
    approved: profile?.approved ?? false,
    isAdmin: profile?.isAdmin ?? false,
    refreshProfile,
  };
}