import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowRight,
  Download,
  Plus,
  Trash2,
  Star,
  Moon,
  Rabbit,
  MessageCircle,
  X,
} from "lucide-react";

type Student = {
  id: string;
  name: string;
  status: string;
  order_index: number;
};

const STATUSES = [
  { key: "star", label: "نجمة", icon: Star, color: "text-yellow-500" },
  { key: "escaped", label: "هارب", icon: Rabbit, color: "text-orange-500" },
  { key: "sleeping", label: "نائم", icon: Moon, color: "text-blue-500" },
  { key: "talking", label: "يتحدث", icon: MessageCircle, color: "text-purple-500" },
] as const;

function statusLabel(s: string) {
  return STATUSES.find((x) => x.key === s)?.label ?? "";
}

export function ClassPage({ classId }: { classId: string }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const load = async () => {
    const { data: cls } = await supabase
      .from("classes")
      .select("name")
      .eq("id", classId)
      .maybeSingle();
    if (cls) setClassName(cls.name);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", classId)
      .order("order_index", { ascending: true });
    if (error) toast.error(error.message);
    else setStudents(data ?? []);
  };

  useEffect(() => {
    if (user) load();
  }, [user, classId]);

  const setStatus = async (id: string, status: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
    const { error } = await supabase
      .from("students")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  const addStudent = async () => {
    if (!newName.trim() || !user) return;
    const max = students.reduce((m, s) => Math.max(m, s.order_index), -1);
    const { error } = await supabase.from("students").insert({
      class_id: classId,
      user_id: user.id,
      name: newName.trim(),
      order_index: max + 1,
    });
    if (error) return toast.error(error.message);
    setNewName("");
    load();
  };

  const removeStudent = async (id: string) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const exportXlsx = () => {
    const rows = students.map((s, i) => ({
      "#": i + 1,
      "اسم الطالب": s.name,
      "الحالة": statusLabel(s.status),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, `${className || "class"}.xlsx`);
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/" className="text-muted-foreground hover:text-foreground shrink-0">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold truncate">{className}</h1>
            <span className="text-xs text-muted-foreground shrink-0">
              ({students.length})
            </span>
          </div>
          <Button onClick={exportXlsx} size="sm" disabled={students.length === 0}>
            <Download className="h-4 w-4 ml-1" /> تصدير Excel
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <Card className="p-3 flex gap-2">
          <Input
            placeholder="إضافة طالب"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addStudent()}
          />
          <Button onClick={addStudent} disabled={!newName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </Card>

        <div className="space-y-2">
          {students.map((s, i) => {
            const active = STATUSES.find((x) => x.key === s.status);
            return (
              <Card key={s.id} className="p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-6 text-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    {active && (
                      <div className={`text-xs flex items-center gap-1 mt-0.5 ${active.color}`}>
                        <active.icon className="h-3 w-3" />
                        {active.label}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStudent(s.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {STATUSES.map((st) => {
                    const isActive = s.status === st.key;
                    const Icon = st.icon;
                    return (
                      <Button
                        key={st.key}
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        onClick={() => setStatus(s.id, isActive ? "" : st.key)}
                        className="h-8"
                      >
                        <Icon className={`h-3.5 w-3.5 ml-1 ${isActive ? "" : st.color}`} />
                        {st.label}
                      </Button>
                    );
                  })}
                  {s.status && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStatus(s.id, "")}
                      className="h-8"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
          {students.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              لا يوجد طلاب في هذا الفصل
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}