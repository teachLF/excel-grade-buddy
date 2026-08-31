import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/components/AdminPanel";
import { AdminGuard } from "@/components/AdminGuard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة المسؤول — متابعة الطلاب" },
      { name: "description", content: "إدارة طلبات الانضمام والموافقة على حسابات المعلمين." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "لوحة المسؤول — متابعة الطلاب" },
      { property: "og:description", content: "إدارة طلبات الانضمام والموافقة على حسابات المعلمين." },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  return (
    <AdminGuard>
      <AdminPanel />
    </AdminGuard>
  );
}
