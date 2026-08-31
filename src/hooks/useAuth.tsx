import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applySession = async (nextSession: Session | null) => {
      if (nextSession) {
        // أكمل إنشاء الملف والدور قبل أن تبدأ الشاشات بطلب بيانات المستخدم.
        const { error } = await supabase.rpc("ensure_my_profile");
        if (error) console.error("Profile bootstrap failed", error);
      }
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      // تنفيذ الطلب خارج callback يمنع تعارض قفل جلسة المصادقة.
      window.setTimeout(() => void applySession(s), 0);
    });
    void supabase.auth.getSession().then(({ data }) => applySession(data.session));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}