import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight, Check, X } from "lucide-react";

type ProfileRow = {
  id: string;
  email: string | null;
  approved: boolean;
  created_at: string;
};

export function AdminPage() {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && !isAdmin) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  const load = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, approved, created_at")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setRows((data ?? []) as ProfileRow[]);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const setApproval = async (id: string, approved: boolean) => {
    setBusyId(id);
    const { error } = await supabase
      .from("profiles")
      .update({ approved })
      .eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(approved ? "تمت الموافقة" : "تم إلغاء الموافقة");
    load();
  };

  if (loading || !user || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">...</div>;
  }

  const pending = rows.filter((r) => !r.approved && r.id !== user.id);
  const approved = rows.filter((r) => r.approved);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">لوحة المسؤول</h1>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowRight className="h-4 w-4 ml-1" /> رجوع
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <section>
          <h2 className="font-semibold mb-3">
            بانتظار الموافقة ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-sm">
              لا توجد طلبات معلّقة.
            </Card>
          ) : (
            <div className="space-y-2">
              {pending.map((r) => (
                <Card key={r.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium" dir="ltr">{r.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("ar")}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => setApproval(r.id, true)}
                  >
                    <Check className="h-4 w-4 ml-1" /> موافقة
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-semibold mb-3">
            مستخدمون معتمدون ({approved.length})
          </h2>
          <div className="space-y-2">
            {approved.map((r) => (
              <Card key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium" dir="ltr">{r.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.id === user.id ? "أنت (المسؤول)" : "معتمد"}
                  </div>
                </div>
                {r.id !== user.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === r.id}
                    onClick={() => setApproval(r.id, false)}
                  >
                    <X className="h-4 w-4 ml-1" /> إلغاء
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}