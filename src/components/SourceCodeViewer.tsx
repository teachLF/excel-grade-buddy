import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight, Copy, FileCode, Search } from "lucide-react";

const modules = import.meta.glob("/src/**/*.{ts,tsx,css}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export function SourceCodeViewer() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (roleLoading || !user) return;
    if (!isAdmin) {
      toast.error("هذه الصفحة للمسؤولين فقط");
      navigate({ to: "/" });
    }
  }, [isAdmin, roleLoading, user, navigate]);

  const files = useMemo(() => Object.keys(modules).sort(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? files.filter((f) => f.toLowerCase().includes(q)) : files;
  }, [files, query]);

  const current = active && modules[active] ? active : filtered[0] ?? null;

  if (authLoading || roleLoading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">أكواد الموقع</h1>
            <p className="text-xs text-muted-foreground">{files.length} ملف</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowRight className="h-4 w-4 ml-1" /> رجوع
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[280px_1fr] gap-4">
        <Card className="p-3 space-y-2 h-fit lg:sticky lg:top-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن ملف..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-9"
            />
          </div>
          <div className="max-h-[65vh] overflow-auto space-y-1">
            {filtered.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                dir="ltr"
                className={`w-full text-left text-xs px-2 py-1.5 rounded truncate transition-colors ${
                  current === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {f.replace("/src/", "")}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground p-2">لا توجد نتائج</p>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs truncate" dir="ltr">
                {current ?? "—"}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!current) return;
                navigator.clipboard.writeText(modules[current]);
                toast.success("تم نسخ الكود");
              }}
            >
              <Copy className="h-4 w-4 ml-1" /> نسخ
            </Button>
          </div>
          <pre
            dir="ltr"
            className="text-left text-xs leading-relaxed overflow-auto max-h-[75vh] p-4 bg-background"
          >
            <code>{current ? modules[current] : ""}</code>
          </pre>
        </Card>
      </main>
    </div>
  );
}
