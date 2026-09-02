import { createFileRoute, Outlet, Link, redirect, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth, STAFF_ROLES, type AppRole } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";

import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, ShoppingCart, Package, Wrench, GraduationCap,
  FileText, Calendar, Receipt, Users, Newspaper, Settings, LogOut, Home, Banknote, Tags, Sparkles,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

type Item = { to: string; icon: any; label: string; roles?: AppRole[] };

function AuthedLayout() {
  const { isAuthenticated, loading, roles, signOut, user, hasAny } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      nav({ to: "/auth", search: { mode: "login", redirect: pathname } });
    }
  }, [isAuthenticated, loading, nav, pathname]);

  useEffect(() => {
    if (!loading && isAuthenticated && roles.length === 0) {
      // ensure a customer role for every user
      supabase.from("user_roles").insert({ user_id: user!.id, role: "customer" } as never).then(() => {});
    }
  }, [loading, isAuthenticated, roles, user]);

  if (loading || !isAuthenticated) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">…</div>;
  }

  const isStaff = hasAny(STAFF_ROLES);

  const items: Item[] = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: "/my-orders", icon: ShoppingCart, label: t("nav.my_orders") },
    { to: "/my-repairs", icon: Wrench, label: t("nav.my_repairs") },
    { to: "/my-memoires", icon: GraduationCap, label: t("nav.my_memoires") },
    ...(isStaff
      ? [
          { to: "/products", icon: Package, label: "Produits", roles: ["super_admin","admin","warehouse","commercial"] as AppRole[] },
          { to: "/admin/categories", icon: Tags, label: "Catégories", roles: ["super_admin","admin","warehouse"] as AppRole[] },
          { to: "/admin/services", icon: Sparkles, label: "Services", roles: ["super_admin","admin"] as AppRole[] },
          { to: "/sales", icon: Banknote, label: "Ventes", roles: ["super_admin","admin","cashier","commercial","warehouse"] as AppRole[] },
          { to: "/orders", icon: ShoppingCart, label: "Commandes", roles: ["super_admin","admin","cashier","commercial","warehouse"] as AppRole[] },
          { to: "/repairs", icon: Wrench, label: "Réparations", roles: ["super_admin","admin","technician","support"] as AppRole[] },
          { to: "/memoires", icon: GraduationCap, label: "Mémoires", roles: ["super_admin","admin","writer","support"] as AppRole[] },
          { to: "/quotes", icon: FileText, label: "Devis", roles: ["super_admin","admin","commercial","support"] as AppRole[] },
          { to: "/appointments", icon: Calendar, label: "RDV", roles: ["super_admin","admin","commercial","support"] as AppRole[] },
          { to: "/invoices", icon: Receipt, label: "Factures", roles: ["super_admin","admin","cashier"] as AppRole[] },
          { to: "/messages", icon: FileText, label: "Messages", roles: ["super_admin","admin","support"] as AppRole[] },
          { to: "/admin/blog", icon: Newspaper, label: "Blog", roles: ["super_admin","admin","support"] as AppRole[] },
          { to: "/users", icon: Users, label: "Utilisateurs", roles: ["super_admin","admin"] as AppRole[] },
          { to: "/settings", icon: Settings, label: "Paramètres", roles: ["super_admin","admin"] as AppRole[] },
        ]
      : []),
  ].filter((i) => !i.roles || hasAny(i.roles));


  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 border-r bg-background hidden md:flex flex-col">
        <div className="p-4 border-b"><Logo /></div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.to;
            return (
              <Link key={it.to} to={it.to as any} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${active ? "bg-brand/10 text-brand font-medium" : "hover:bg-muted"}`}>
                <Icon className="h-4 w-4" />{it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted"><Home className="h-4 w-4" />Site public</Link>
          <button onClick={() => { signOut(); nav({ to: "/" }); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-destructive/10 text-destructive"><LogOut className="h-4 w-4" />{t("nav.logout")}</button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="md:hidden border-b bg-background p-3 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Button size="sm" variant="ghost" onClick={() => { signOut(); nav({ to: "/" }); }}><LogOut className="h-4 w-4" /></Button>
          </div>
        </header>
        <header className="hidden md:flex border-b bg-background px-6 py-2 items-center justify-end">
          <NotificationBell />
        </header>
        <div className="p-4 md:p-8"><Outlet /></div>
      </main>

    </div>
  );
}
