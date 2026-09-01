import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  Users,
  CalendarDays,
  Star,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { pointsFor } from "@/components/ClassStatsDialog";

type ClassRow = { id: string; name: string };
type Student = { id: string; name: string; class_id: string };
type Ev = { student_id: string; event_type: string; created_at: string };

const STATUS_LABEL: Record<string, string> = {
  star: "نجوم",
  present: "حاضر",
  absent: "غائب",
  escaped: "هارب",
  misbehaving: "شاغب",
  sleeping: "نائم",
  talking: "يتحدث",
};

// لوحة ألوان متناسقة تعمل في الوضعين الفاتح والليلي
const PALETTE = ["#6366f1", "#10b981", "#f43f5e", "#f97316", "#eab308", "#a855f7", "#3b82f6"];

function StatCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tint: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`grid place-items-center h-11 w-11 rounded-xl ${tint}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </Card>
  );
}

export function AnalyticsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [c, s, e] = await Promise.all([
        supabase.from("classes").select("id,name"),
        supabase.from("students").select("id,name,class_id"),
        supabase.from("student_events").select("student_id,event_type,created_at"),
      ]);
      if (!active) return;
      if (c.error || s.error || e.error) {
        toast.error("تعذر تحميل بيانات التقارير");
      }
      setClasses(c.data ?? []);
      setStudents((s.data ?? []) as Student[]);
      setEvents((e.data ?? []) as Ev[]);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // توزيع الحالات
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of events) counts[ev.event_type] = (counts[ev.event_type] ?? 0) + 1;
    return Object.entries(counts)
      .map(([k, v]) => ({ name: STATUS_LABEL[k] ?? k, key: k, value: v }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  // الحضور عبر آخر 14 يومًا
  const trendData = useMemo(() => {
    const days: { date: string; label: string; present: number; absent: number }[] = [];
    const byDay = new Map<string, { present: number; absent: number }>();
    for (const ev of events) {
      if (ev.event_type !== "present" && ev.event_type !== "absent") continue;
      const d = new Date(ev.created_at);
      const key = d.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { present: 0, absent: 0 };
      if (ev.event_type === "present") cur.present += 1;
      else cur.absent += 1;
      byDay.set(key, cur);
    }
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { present: 0, absent: 0 };
      days.push({
        date: key,
        label: d.toLocaleDateString("ar", { day: "numeric", month: "numeric" }),
        present: cur.present,
        absent: cur.absent,
      });
    }
    return days;
  }, [events]);

  // مقارنة الفصول حسب متوسط النقاط
  const classCompare = useMemo(() => {
    return classes
      .map((c) => {
        const roster = students.filter((s) => s.class_id === c.id);
        const totalPts = roster.reduce((sum, s) => sum + pointsFor(s.id, events), 0);
        const avg = roster.length ? Math.round((totalPts / roster.length) * 10) / 10 : 0;
        return { name: c.name, students: roster.length, avg };
      })
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);
  }, [classes, students, events]);

  // أفضل الطلاب على مستوى كل الفصول
  const topStudents = useMemo(() => {
    const classMap = new Map(classes.map((c) => [c.id, c.name]));
    return students
      .map((s) => ({
        id: s.id,
        name: s.name,
        className: classMap.get(s.class_id) ?? "",
        points: pointsFor(s.id, events),
        stars: events.filter((e) => e.student_id === s.id && e.event_type === "star").length,
      }))
      .filter((s) => s.points !== 0 || s.stars > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 8);
  }, [students, events, classes]);

  const attendanceRate = useMemo(() => {
    const present = events.filter((e) => e.event_type === "present").length;
    const absent = events.filter((e) => e.event_type === "absent").length;
    const denom = present + absent;
    return denom ? Math.round((present / denom) * 100) : 0;
  }, [events]);

  const totalStars = events.filter((e) => e.event_type === "star").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-background to-background dark:from-background">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <Link to="/" className="text-muted-foreground hover:text-foreground shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" /> التقارير والتحليلات
          </h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {!ready ? (
          <div className="text-center text-muted-foreground py-20">جاري تحميل التقارير...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={<Users className="h-5 w-5 text-indigo-600" />}
                tint="bg-indigo-100 dark:bg-indigo-500/15"
                label="عدد الفصول"
                value={classes.length}
              />
              <StatCard
                icon={<CalendarDays className="h-5 w-5 text-emerald-600" />}
                tint="bg-emerald-100 dark:bg-emerald-500/15"
                label="عدد الطلاب"
                value={students.length}
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-sky-600" />}
                tint="bg-sky-100 dark:bg-sky-500/15"
                label="نسبة الحضور"
                value={`${attendanceRate}%`}
              />
              <StatCard
                icon={<Star className="h-5 w-5 text-amber-500" />}
                tint="bg-amber-100 dark:bg-amber-500/15"
                label="إجمالي النجوم"
                value={totalStars}
              />
            </div>

            <Card className="p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" /> الحضور والغياب (آخر 14 يومًا)
              </h2>
              {events.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trendData} margin={{ left: -20, right: 8 }}>
                    <defs>
                      <linearGradient id="present" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="absent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                    <XAxis dataKey="label" fontSize={11} tickMargin={6} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        color: "var(--popover-foreground)",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="present"
                      name="حاضر"
                      stroke="#10b981"
                      fill="url(#present)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="absent"
                      name="غائب"
                      stroke="#f43f5e"
                      fill="url(#absent)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="p-5">
                <h2 className="font-semibold mb-4">توزيع الحالات</h2>
                {statusData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={44}
                        paddingAngle={2}
                      >
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          color: "var(--popover-foreground)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card className="p-5">
                <h2 className="font-semibold mb-4">مقارنة الفصول (متوسط النقاط)</h2>
                {classCompare.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={classCompare} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                      <XAxis dataKey="name" fontSize={11} tickMargin={6} />
                      <YAxis fontSize={11} />
                      <Tooltip
                        cursor={{ fill: "currentColor", opacity: 0.05 }}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Bar dataKey="avg" name="متوسط النقاط" radius={[6, 6, 0, 0]}>
                        {classCompare.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            <Card className="p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> أفضل الطلاب (كل الفصول)
              </h2>
              {topStudents.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  لا توجد نقاط كافية بعد لعرض الترتيب.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {topStudents.map((s, i) => {
                    const medal = i === 0 ? "1" : i === 1 ? "2" : i === 2 ? "3" : `${i + 1}`;
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                          i < 3 ? "bg-accent" : "bg-muted/50"
                        }`}
                      >
                        <span className="grid place-items-center w-7 h-7 rounded-full bg-background text-sm font-bold shrink-0">
                          {medal}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{s.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.className}</p>
                        </div>
                        {s.stars > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-500 text-xs">
                            <Star className="h-3 w-3 fill-amber-400" /> {s.stars}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            s.points > 0
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                          }`}
                        >
                          {s.points > 0 ? `+${s.points}` : s.points}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <div className="text-center">
              <Button variant="outline" asChild>
                <Link to="/leaderboard">
                  <Trophy className="h-4 w-4 ml-1" /> عرض لوحة الصدارة العامة
                </Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[240px] grid place-items-center text-sm text-muted-foreground">
      لا توجد بيانات كافية بعد.
    </div>
  );
}
