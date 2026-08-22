import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useAuth, STAFF_ROLES } from "@/lib/auth";
import { fr } from "@/lib/labels";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Wrench, GraduationCap, DollarSign, Users, FileText } from "lucide-react";
import { formatXOF, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — HiloTek" }] }),
  component: Dash,
});

function Dash() {
  const { user, hasAny, roles } = useAuth();
  const { t, lang } = useI18n();
  const isStaff = hasAny(STAFF_ROLES);

  const { data: mine } = useQuery({
    queryKey: ["dash-mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const email = user!.email;
      const [orders, reps, mems] = await Promise.all([
        supabase.from("orders").select("id,total,status,created_at,order_number").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5),
        email ? supabase.from("repairs").select("id,repair_number,status,created_at").eq("client_email", email).order("created_at", { ascending: false }).limit(5) : Promise.resolve({ data: [] as any[] }),
        email ? supabase.from("memoires").select("id,memoire_number,status,progress").eq("client_email", email).order("created_at", { ascending: false }).limit(5) : Promise.resolve({ data: [] as any[] }),
      ]);
      return { orders: orders.data ?? [], reps: reps.data ?? [], mems: mems.data ?? [] };
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dash-stats"],
    enabled: isStaff,
    queryFn: async () => {
      const [orders, reps, mems, prods, users, revenue] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("repairs").select("id", { count: "exact", head: true }),
        supabase.from("memoires").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total").eq("payment_status", "paid"),
      ]);
      const total = (revenue.data ?? []).reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);
      return {
        orders: orders.count ?? 0, reps: reps.count ?? 0, mems: mems.count ?? 0,
        prods: prods.count ?? 0, users: users.count ?? 0, revenue: total,
      };
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">{t("nav.dashboard")}</h1>
        <p className="text-muted-foreground">Bienvenue {user?.email}. Rôles : <span className="font-medium">{roles.join(", ") || "customer"}</span></p>
      </div>

      {isStaff && stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={DollarSign} label="Revenus (payé)" value={formatXOF(stats.revenue, lang)} />
          <StatCard icon={ShoppingCart} label="Commandes" value={String(stats.orders)} />
          <StatCard icon={Wrench} label="Réparations" value={String(stats.reps)} />
          <StatCard icon={GraduationCap} label="Mémoires" value={String(stats.mems)} />
          <StatCard icon={Users} label="Utilisateurs" value={String(stats.users)} />
          <StatCard icon={FileText} label="Produits" value={String(stats.prods)} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <MiniList title="Mes dernières commandes" empty="Aucune commande">
          {(mine?.orders ?? []).map((o: any) => (
            <li key={o.id} className="flex justify-between py-2 border-b last:border-0 text-sm">
              <div><div className="font-mono">{o.order_number}</div><div className="text-xs text-muted-foreground">{fr(o.status)}</div></div>
              <div className="font-semibold">{formatXOF(Number(o.total), lang)}</div>
            </li>
          ))}
        </MiniList>
        <MiniList title="Mes réparations" empty="Aucune réparation">
          {(mine?.reps ?? []).map((r: any) => (
            <li key={r.id} className="flex justify-between py-2 border-b last:border-0 text-sm">
              <span className="font-mono">{r.repair_number}</span><span className="text-xs text-muted-foreground">{fr(r.status)}</span>
            </li>
          ))}
        </MiniList>
        <MiniList title="Mes mémoires" empty="Aucun mémoire">
          {(mine?.mems ?? []).map((m: any) => (
            <li key={m.id} className="flex justify-between py-2 border-b last:border-0 text-sm">
              <span className="font-mono">{m.memoire_number}</span><span className="text-xs text-muted-foreground">{m.progress ?? 0}%</span>
            </li>
          ))}
        </MiniList>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl gradient-brand grid place-items-center text-brand-foreground"><Icon className="h-6 w-6" /></div>
      <div><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-display font-bold">{value}</div></div>
    </Card>
  );
}
function MiniList({ title, empty, children }: any) {
  const arr = (children as any[]) ?? [];
  return (
    <Card className="p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      {arr.length ? <ul>{children}</ul> : <div className="text-sm text-muted-foreground">{empty}</div>}
    </Card>
  );
}
