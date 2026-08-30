import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Plus, Upload, Trash2, Users, Shield, Code2, GraduationCap } from "lucide-react";

type ClassRow = { id: string; name: string; created_at: string };

export function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("approved")
        .eq("id", user.id)
        .maybeSingle();
      if (active) setApproved(!!data?.approved);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const load = async () => {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setClasses(data ?? []);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const createClass = async () => {
    if (!newName.trim() || !user) return;
    const { error } = await supabase
      .from("classes")
      .insert({ name: newName.trim(), user_id: user.id });
    if (error) return toast.error(error.message);
    setNewName("");
    toast.success("تم إنشاء الفصل");
    load();
  };

  const deleteClass = async (id: string) => {
    if (!confirm("حذف الفصل وكل طلابه؟")) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
      const names: string[] = [];
      for (const row of rows) {
        for (const cell of row) {
          const v = String(cell ?? "").trim();
          if (v) {
            names.push(v);
            break;
          }
        }
      }
      // skip a header row if it doesn't look like a name
      const filtered = names.filter(
        (n, i) =>
          !(i === 0 && /name|اسم|الطالب|student/i.test(n))
      );
      if (filtered.length === 0) {
        toast.error("لم يتم العثور على أسماء في الملف");
        return;
      }
      const className = file.name.replace(/\.(xlsx|xls|csv)$/i, "");
      const { data: cls, error: e1 } = await supabase
        .from("classes")
        .insert({ name: className, user_id: user.id })
        .select()
        .single();
      if (e1 || !cls) throw e1;
      const payload = filtered.map((name, idx) => ({
        class_id: cls.id,
        user_id: user.id,
        name,
        order_index: idx,
      }));
      const { error: e2 } = await supabase.from("students").insert(payload);
      if (e2) throw e2;
      toast.success(`تم استيراد ${filtered.length} طالب`);
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "فشل الاستيراد";
      toast.error(msg);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">...</div>;
  }

  if (approved === null) {
    return <div className="min-h-screen flex items-center justify-center">...</div>;
  }

  if (!approved && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <h1 className="text-xl font-bold">حسابك قيد المراجعة</h1>
          <p className="text-sm text-muted-foreground">
            تم إنشاء حسابك بنجاح، لكن يحتاج موافقة المسؤول قبل استخدام التطبيق. سيتم تفعيله قريبًا.
          </p>
          <p className="text-xs text-muted-foreground" dir="ltr">{user.email}</p>
          <Button variant="outline" onClick={logout} className="w-full">
            <LogOut className="h-4 w-4 ml-1" /> تسجيل الخروج
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">متابعة الطلاب</h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin">
                    <Shield className="h-4 w-4 ml-1" /> لوحة المسؤول
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/source">
                    <Code2 className="h-4 w-4 ml-1" /> أكواد الموقع
                  </Link>
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 ml-1" /> خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-5">
          <h2 className="font-semibold mb-3">إنشاء فصل جديد</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="اسم الفصل"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createClass()}
            />
            <Button onClick={createClass} disabled={!newName.trim()}>
              <Plus className="h-4 w-4 ml-1" /> إضافة
            </Button>
            <Button
              variant="secondary"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              <Upload className="h-4 w-4 ml-1" />
              {busy ? "جاري..." : "استيراد من Excel"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ملف Excel: أسماء الطلاب في العمود الأول (يُتجاهل صف العنوان إن وجد).
          </p>
        </Card>

        <div>
          <h2 className="font-semibold mb-3">فصولي</h2>
          {classes.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              لا توجد فصول بعد. أنشئ فصلاً أو استورد ملف Excel للبدء.
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map((c) => (
                <Card key={c.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                  <Link
                    to="/class/$id"
                    params={{ id: c.id }}
                    className="flex-1 flex items-center gap-2 font-medium"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {c.name}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteClass(c.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}