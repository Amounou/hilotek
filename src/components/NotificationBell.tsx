import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, STAFF_ROLES } from "@/lib/auth";
import { fr } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  to?: string;
  at: string;
  read: boolean;
};

const KEY = "hilotek.notifications";
const MAX = 50;

type Rule = {
  table: string;
  to?: string;
  queryKeys?: string[];
  staffOnly?: boolean;
  label: (evt: string, row: any, old: any) => { title: string; body: string } | null;
};

const RULES: Rule[] = [
  {
    table: "orders",
    to: "/orders",
    queryKeys: ["admin-orders", "me-orders", "dash-stats", "dash-mine"],
    label: (evt, r, o) => {
      if (evt === "INSERT") return { title: "Nouvelle commande", body: `${r.order_number} — ${r.customer_name}` };
      if (o?.status !== r.status) return { title: "Commande mise à jour", body: `${r.order_number} → ${fr(r.status)}` };
      if (o?.payment_status !== r.payment_status) return { title: "Paiement commande", body: `${r.order_number} → ${fr(r.payment_status)}` };
      return null;
    },
  },
  {
    table: "sales",
    to: "/sales",
    staffOnly: true,
    queryKeys: ["sales-list", "dash-stats"],
    label: (evt, r) => (evt === "INSERT" ? { title: "Nouvelle vente", body: `${r.invoice_number ?? ""} — ${r.client_name}` } : null),
  },
  {
    table: "proformas",
    to: "/quotes/list",
    staffOnly: true,
    queryKeys: ["proformas-list"],
    label: (evt, r, o) => {
      if (evt === "INSERT") return { title: "Nouveau devis", body: `${r.proforma_number ?? ""} — ${r.client_name}` };
      if (o?.status !== r.status) return { title: "Devis mis à jour", body: `${r.proforma_number} → ${fr(r.status)}` };
      return null;
    },
  },
  {
    table: "quote_requests",
    to: "/quotes",
    staffOnly: true,
    queryKeys: ["admin-quotes"],
    label: (evt, r, o) => {
      if (evt === "INSERT") return { title: "Demande de devis", body: `${r.request_number} — ${r.name}` };
      if (o?.status !== r.status) return { title: "Demande de devis", body: `${r.request_number} → ${fr(r.status)}` };
      return null;
    },
  },
  {
    table: "repairs",
    to: "/repairs",
    queryKeys: ["admin-repairs", "me-repairs", "dash-stats"],
    label: (evt, r, o) => {
      if (evt === "INSERT") return { title: "Nouvelle réparation", body: `${r.repair_number} — ${r.client_name}` };
      if (o?.status !== r.status) return { title: "Réparation", body: `${r.repair_number} → ${fr(r.status)}` };
      return null;
    },
  },
  {
    table: "memoires",
    to: "/memoires",
    queryKeys: ["admin-memoires", "me-memoires", "dash-stats"],
    label: (evt, r, o) => {
      if (evt === "INSERT") return { title: "Nouveau mémoire", body: `${r.memoire_number} — ${r.client_name}` };
      if (o?.status !== r.status) return { title: "Mémoire", body: `${r.memoire_number} → ${fr(r.status)}` };
      if (o?.progress !== r.progress) return { title: "Mémoire", body: `${r.memoire_number} — progression ${r.progress}%` };
      return null;
    },
  },
  {
    table: "contact_messages",
    to: "/messages",
    staffOnly: true,
    queryKeys: ["admin-messages"],
    label: (evt, r) => (evt === "INSERT" ? { title: "Nouveau message", body: `${r.name} — ${r.subject ?? "Contact"}` } : null),
  },
  {
    table: "service_bookings",
    to: "/appointments",
    staffOnly: true,
    queryKeys: ["admin-bookings"],
    label: (evt, r, o) => {
      if (evt === "INSERT") return { title: "Nouveau rendez-vous", body: `${r.booking_number} — ${r.client_name}` };
      if (o?.status !== r.status) return { title: "Rendez-vous", body: `${r.booking_number} → ${fr(r.status)}` };
      return null;
    },
  },
  {
    table: "products",
    to: "/products",
    staffOnly: true,
    queryKeys: ["admin-products", "products-min", "products"],
    label: (evt, r, o) => {
      if (evt === "INSERT") return { title: "Nouveau produit", body: r.name_fr };
      if (o && o.stock !== r.stock) {
        if (r.stock === 0) return { title: "Rupture de stock", body: `${r.name_fr} — stock épuisé` };
        if (r.stock <= 5) return { title: "Stock faible", body: `${r.name_fr} — ${r.stock} restant(s)` };
        return { title: "Stock mis à jour", body: `${r.name_fr} — ${o.stock} → ${r.stock}` };
      }
      return null;
    },
  },
  {
    table: "inventory_movements",
    to: "/products",
    staffOnly: true,
    label: (evt, r) =>
      evt === "INSERT"
        ? { title: "Mouvement de stock", body: `${fr(r.movement_type)} · ${r.quantity} — ${r.reason ?? ""}` }
        : null,
  },
];

function load(): AppNotification[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

export function NotificationBell() {
  const { user, hasAny } = useAuth();
  const qc = useQueryClient();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const isStaff = hasAny(STAFF_ROLES);
  const staffRef = useRef(isStaff);
  staffRef.current = isStaff;

  useEffect(() => setItems(load()), []);

  useEffect(() => {
    if (!user) return;
    // Nom unique : évite la réutilisation d'un canal déjà abonné (double montage React)
    const channel = supabase.channel(`hilotek-activity-${Math.random().toString(36).slice(2)}`);

    RULES.forEach((rule) => {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: rule.table },
        (payload: any) => {
          if (rule.staffOnly && !staffRef.current) return;
          const row = payload.new ?? {};
          const old = payload.old ?? null;
          const info = rule.label(payload.eventType, row, old);
          if (!info) return;

          const notif: AppNotification = {
            id: `${rule.table}-${row.id ?? Math.random()}-${Date.now()}`,
            title: info.title,
            body: info.body,
            to: rule.to,
            at: new Date().toISOString(),
            read: false,
          };
          setItems((prev) => {
            const next = [notif, ...prev].slice(0, MAX);
            try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
          });
          toast(info.title, { description: info.body });
          (rule.queryKeys ?? []).forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
        },
      );
    });

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  const unread = items.filter((i) => !i.read).length;

  const markAll = () => {
    setItems((prev) => {
      const next = prev.map((i) => ({ ...i, read: true }));
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setTimeout(markAll, 1200); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 justify-center bg-brand-orange text-white border-0 text-[10px]">
              {unread > 9 ? "9+" : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          <Button variant="ghost" size="sm" onClick={markAll} className="h-7 text-xs">
            <CheckCheck className="h-3.5 w-3.5 mr-1" />Tout lire
          </Button>
        </div>
        <ScrollArea className="max-h-80">
          {items.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Aucune notification</div>
          )}
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id} className={n.read ? "" : "bg-muted/40"}>
                {n.to ? (
                  <Link to={n.to as any} className="block px-3 py-2 hover:bg-muted/60" onClick={() => setOpen(false)}>
                    <NotifBody n={n} />
                  </Link>
                ) : (
                  <div className="px-3 py-2"><NotifBody n={n} /></div>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function NotifBody({ n }: { n: AppNotification }) {
  return (
    <>
      <div className="text-sm font-medium">{n.title}</div>
      <div className="text-xs text-muted-foreground">{n.body}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        {new Date(n.at).toLocaleString("fr-FR")}
      </div>
    </>
  );
}
