import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, formatXOF } from "@/lib/i18n";
import { Search } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  received: "Reçu", assigned: "Rédacteur attribué", in_progress: "En cours",
  review: "En relecture", completed: "Terminé", delivered: "Livré", cancelled: "Annulé",
};

export const Route = createFileRoute("/suivi-memoire")({
  head: () => ({ meta: [{ title: "Suivi mémoire — @lkof" }] }),
  component: () => {
    const { t, lang } = useI18n();
    const [q, setQ] = useState("");
    const [m, setM] = useState<any>(null);
    const [hist, setHist] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);
    const search = async (e: React.FormEvent) => {
      e.preventDefault(); setSearched(true);
      const { data } = await supabase.from("memoires").select("*")
        .or(`memoire_number.eq.${q},tracking_token.eq.${q}`).maybeSingle();
      setM(data);
      if (data) {
        const { data: h } = await supabase.from("memoire_status_history").select("*")
          .eq("memoire_id", data.id).order("created_at", { ascending: false });
        setHist(h ?? []);
      }
    };
    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl px-4 py-16">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-center">{t("mem.title")}</h1>
          <p className="text-center text-muted-foreground mt-2 mb-6">{t("rep.enter")}</p>
          <form onSubmit={search} className="flex gap-2">
            <Input placeholder="MEM-… ou jeton" value={q} onChange={(e) => setQ(e.target.value.trim())} required />
            <Button type="submit" className="gradient-brand text-brand-foreground border-0"><Search className="h-4 w-4 mr-1" />{t("rep.search")}</Button>
          </form>
          {searched && !m && <div className="mt-8 text-center text-muted-foreground">{t("rep.not_found")}</div>}
          {m && (
            <Card className="mt-8 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-muted-foreground">Dossier</div>
                  <div className="font-mono font-semibold">{m.memoire_number}</div>
                </div>
                <Badge>{STATUS_LABEL[m.status]}</Badge>
              </div>
              <div className="mb-4">
                <div className="text-xs text-muted-foreground mb-1">{t("mem.progress")}</div>
                <Progress value={m.progress ?? 0} />
                <div className="text-xs text-right mt-1">{m.progress ?? 0}%</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-muted-foreground">Thème</div><div>{m.theme}</div></div>
                <div><div className="text-xs text-muted-foreground">Université</div><div>{m.university ?? "-"}</div></div>
                <div><div className="text-xs text-muted-foreground">Niveau</div><div>{m.level ?? "-"}</div></div>
                <div><div className="text-xs text-muted-foreground">Filière</div><div>{m.filiere ?? "-"}</div></div>
                <div><div className="text-xs text-muted-foreground">Total</div><div>{formatXOF(Number(m.total_amount), lang)}</div></div>
                <div><div className="text-xs text-muted-foreground">Solde</div><div>{formatXOF(Number(m.balance), lang)}</div></div>
              </div>
              <div className="mt-6">
                <div className="font-semibold text-sm mb-2">{t("rep.history")}</div>
                <div className="space-y-2">
                  {hist.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-brand mt-1.5" />
                      <div className="flex-1">
                        <div className="font-medium">{STATUS_LABEL[h.status]}</div>
                        <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
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
