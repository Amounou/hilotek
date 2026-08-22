import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Search } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  received: "Réception", diagnosis: "Diagnostic", waiting_parts: "Pièces commandées",
  in_repair: "En réparation", completed: "Terminé", delivered: "Livré", cancelled: "Annulé",
};
const STATUS_COLOR: Record<string, string> = {
  received: "secondary", diagnosis: "default", waiting_parts: "warning",
  in_repair: "default", completed: "default", delivered: "default", cancelled: "destructive",
};

export const Route = createFileRoute("/suivi-reparation")({
  head: () => ({ meta: [{ title: "Suivi de réparation — HiloTek" }] }),
  component: () => {
    const { t } = useI18n();
    const [q, setQ] = useState("");
    const [rep, setRep] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);
    const search = async (e: React.FormEvent) => {
      e.preventDefault(); setSearched(true);
      const { data } = await (supabase as any).rpc("track_repair", { _token: q });
      if (data) {
        setRep(data);
        setHistory(Array.isArray(data.history) ? data.history : []);
      } else {
        setRep(null); setHistory([]);
      }
    };
    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl px-4 py-16">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-center">{t("rep.title")}</h1>
          <p className="text-center text-muted-foreground mt-2 mb-6">{t("rep.enter")}</p>
          <form onSubmit={search} className="flex gap-2">
            <Input placeholder="REP-… ou jeton" value={q} onChange={(e) => setQ(e.target.value.trim())} required />
            <Button type="submit" className="gradient-brand text-brand-foreground border-0"><Search className="h-4 w-4 mr-1" />{t("rep.search")}</Button>
          </form>
          {searched && !rep && <div className="mt-8 text-center text-muted-foreground">{t("rep.not_found")}</div>}
          {rep && (
            <Card className="mt-8 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-muted-foreground">Dossier</div>
                  <div className="font-mono font-semibold">{rep.repair_number}</div>
                </div>
                <Badge>{STATUS_LABEL[rep.status]}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-muted-foreground">{t("rep.device")}</div><div>{rep.device_type} {rep.brand} {rep.model}</div></div>
                <div><div className="text-xs text-muted-foreground">Client</div><div>{rep.client_name}</div></div>
                <div className="col-span-2"><div className="text-xs text-muted-foreground">{t("rep.issue")}</div><div>{rep.issue_description}</div></div>
                {rep.diagnosis && <div className="col-span-2"><div className="text-xs text-muted-foreground">Diagnostic</div><div>{rep.diagnosis}</div></div>}
              </div>
              <div className="mt-6">
                <div className="font-semibold text-sm mb-2">{t("rep.history")}</div>
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-brand mt-1.5" />
                      <div className="flex-1">
                        <div className="font-medium">{STATUS_LABEL[h.status]}</div>
                        <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
                        {h.note && <div className="text-xs mt-0.5">{h.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </PublicShell>
    );
  },
});
