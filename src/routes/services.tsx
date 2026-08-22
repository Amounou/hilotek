import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { useI18n, formatXOF } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — HiloTek Services & Tech" },
      { name: "description", content: "Maintenance, développement, cybersécurité, cloud, formation et rédaction de mémoire." },
      { property: "og:title", content: "Services — HiloTek" },
    ],
  }),
  component: Services,
});

function Services() {
  const { t, lang } = useI18n();
  const { data } = useQuery({
    queryKey: ["services-all"],
    queryFn: async () => (await supabase.from("services").select("*").eq("is_active", true).order("sort_order")).data ?? [],
  });
  return (
    <PublicShell>
      <section className="border-b relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold">{t("srv.title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("home.services.subtitle")}</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((s: any) => {
            const Icon = (Icons as any)[s.icon] ?? Icons.Wrench;
            return (
              <Card key={s.id} className="p-6 border-border/60 hover:shadow-elegant transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-brand grid place-items-center shrink-0 group-hover:scale-105 transition">
                    <Icon className="h-5 w-5 text-brand-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{lang === "fr" ? s.name_fr : s.name_en}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{lang === "fr" ? s.description_fr : s.description_en}</p>
                    <div className="mt-4 flex items-center justify-between">
                      {s.price_from && (
                        <div className="text-xs text-muted-foreground">
                          {t("srv.from")} <span className="font-semibold text-foreground">{formatXOF(Number(s.price_from), lang)}</span>
                        </div>
                      )}
                      <Link to="/rendez-vous" search={{ service: s.slug }}>
                        <Button size="sm" className="gradient-brand text-brand-foreground border-0">{t("srv.book")}</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </PublicShell>
  );
}
