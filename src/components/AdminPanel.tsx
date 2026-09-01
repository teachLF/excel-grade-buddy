import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight, Check, X, Search, RefreshCw } from "lucide-react";

type Profile = {
  id: string;
  email: string | null;
  approved: boolean;
  created_at: string;
};

export function AdminPanel() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");

  // access control handled by <AdminGuard>


  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, approved, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setProfiles(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [isAdmin]);

  const setApproved = async (id: string, approved: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ approved })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(approved ? "تمت الموافقة" : "تم الإلغاء");
    setProfiles((p) => p.map((x) => (x.id === id ? { ...x, approved } : x)));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate).getTime() : null;
    const to = toDate ? new Date(toDate).getTime() + 86400000 : null;
    return profiles.filter((p) => {
      if (statusFilter === "pending" && p.approved) return false;
      if (statusFilter === "approved" && !p.approved) return false;
      if (q && !(p.email ?? "").toLowerCase().includes(q)) return false;
      const t = new Date(p.created_at).getTime();
      if (from && t < from) return false;
      if (to && t >= to) return false;
      return true;
    });
  }, [profiles, query, fromDate, toDate, statusFilter]);

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">...</div>;
  }


  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">لوحة المسؤول</h1>
            <p className="text-xs text-muted-foreground">إدارة طلبات الانضمام</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowRight className="h-4 w-4 ml-1" /> رجوع
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <Card className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالبريد الإلكتروني..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-9"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">من تاريخ</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">إلى تاريخ</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">الحالة</label>
              <div className="flex gap-1 mt-1">
                {(["pending", "approved", "all"] as const).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={statusFilter === s ? "default" : "outline"}
                    onClick={() => setStatusFilter(s)}
                    className="flex-1"
                  >
                    {s === "pending" ? "قيد الانتظار" : s === "approved" ? "موافق عليهم" : "الكل"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          {(query || fromDate || toDate || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setFromDate("");
                setToDate("");
                setStatusFilter("all");
              }}
            >
              مسح التصفية
            </Button>
          )}
        </Card>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {loading ? "جاري التحميل..." : `${filtered.length} من ${profiles.length} مستخدم`}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`ml-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث الطلبات
          </Button>
        </div>

        {filtered.length === 0 && !loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            لا توجد نتائج
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <Card key={p.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate" dir="ltr">
                    {p.email ?? "(بدون بريد)"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString("ar")}
                    {" · "}
                    <span className={p.approved ? "text-green-600" : "text-amber-600"}>
                      {p.approved ? "موافق عليه" : "قيد الانتظار"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {p.approved ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setApproved(p.id, false)}
                      disabled={p.id === user?.id}
                    >
                      <X className="h-4 w-4 ml-1" /> إلغاء
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setApproved(p.id, true)}>
                      <Check className="h-4 w-4 ml-1" /> موافقة
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}