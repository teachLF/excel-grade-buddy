import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, Trophy, GraduationCap, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type Stats = {
  student_name: string | null;
  present_count: number;
  absent_count: number;
  star_count: number;
  sleeping_count: number;
  escaped_count: number;
  talking_count: number;
  misbehaving_count: number;
  total_points: number;
};

const CARDS = [
  { key: "present_count", label: "حضور", emoji: "✅", tone: "bg-emerald-50 text-emerald-700" },
  { key: "absent_count", label: "غياب", emoji: "❌", tone: "bg-rose-50 text-rose-700" },
  { key: "star_count", label: "نجمة", emoji: "⭐", tone: "bg-amber-50 text-amber-700" },
  { key: "sleeping_count", label: "نوم", emoji: "😴", tone: "bg-blue-50 text-blue-700" },
  { key: "escaped_count", label: "هروب", emoji: "🏃‍♀️", tone: "bg-orange-50 text-orange-700" },
  { key: "talking_count", label: "تحدّث", emoji: "🗣️", tone: "bg-purple-50 text-purple-700" },
  { key: "misbehaving_count", label: "شغب", emoji: "🤪", tone: "bg-pink-50 text-pink-700" },
] as const;

export function MyStatsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc("my_student_stats");
      if (!active) return;
      if (error) toast.error(error.message);
      const row = Array.isArray(data) ? (data[0] as Stats | undefined) : undefined;
      setStats(row ?? null);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  if (loading || !user || !ready) {
    return <div className="min-h-screen flex items-center justify-center">...</div>;
  }

  const notLinked = !stats || stats.student_name === null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-background to-background">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-accent-gradient text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <h1 className="text-lg font-bold truncate">إحصائياتي</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild size="sm" variant="outline">
              <Link to="/leaderboard">
                <Trophy className="h-4 w-4 ml-1" /> لوحة الصدارة
              </Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {notLinked ? (
          <Card className="p-8 text-center space-y-3">
            <div className="text-4xl">🔒</div>
            <h2 className="font-bold text-lg">لا توجد سجلات مرتبطة ببريدك</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              بريدك <b dir="ltr">{user.email}</b> غير مسجَّل عند أي معلمة بعد. اطلبي من معلمتك إضافة
              بريدك الإلكتروني بجانب اسمك في الدفتر.
            </p>
          </Card>
        ) : (
          <>
            <Card className="p-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">مرحباً</div>
                <div className="font-bold truncate">{stats!.student_name}</div>
                <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> بياناتك خاصة بك ولا يمكن لأحد غيرك رؤيتها
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className="text-3xl font-extrabold text-primary">{stats!.total_points}</div>
                <div className="text-xs text-muted-foreground">مجموع النقاط</div>
              </div>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CARDS.map((c) => (
                <Card key={c.key} className={`p-4 text-center ${c.tone}`}>
                  <div className="text-2xl">{c.emoji}</div>
                  <div className="text-2xl font-bold mt-1">{stats![c.key] as number}</div>
                  <div className="text-xs">{c.label}</div>
                </Card>
              ))}
            </div>

            <Card className="p-4 text-xs text-muted-foreground leading-relaxed">
              نظام النقاط: حاضر +1 · نجمة +5 · غائب 0 · نائم -1 · تحدّث -1 · هارب -2 · شاغب -2
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
