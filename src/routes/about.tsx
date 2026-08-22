import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Award, Target, Eye, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — HiloTek Services & Tech" },
      { name: "description", content: "Découvrez l'histoire, la mission et les valeurs d'HiloTek Services & Tech." },
      { property: "og:title", content: "À propos — HiloTek" },
    ],
  }),
  component: () => {
    const { t } = useI18n();
    return (
      <PublicShell>
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 gradient-mesh opacity-60" />
          <div className="relative mx-auto max-w-5xl px-4 py-20 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold">{t("about.title")}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t("about.subtitle")}</p>
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-4 py-16 grid gap-6 md:grid-cols-2">
          <Card className="p-8 border-border/60">
            <Target className="h-8 w-8 text-brand mb-3" />
            <h2 className="font-display text-2xl font-semibold">{t("about.mission.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("about.mission.text")}</p>
          </Card>
          <Card className="p-8 border-border/60">
            <Eye className="h-8 w-8 text-brand-orange mb-3" />
            <h2 className="font-display text-2xl font-semibold">{t("about.vision.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("about.vision.text")}</p>
          </Card>
        </section>
        <section className="mx-auto max-w-5xl px-4 pb-20">
          <h2 className="font-display text-3xl font-semibold text-center mb-8">{t("about.values.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {["about.v1","about.v2","about.v3","about.v4"].map((k) => (
              <Card key={k} className="p-6 text-center border-border/60">
                <Sparkles className="h-6 w-6 mx-auto text-brand mb-2" />
                <div className="font-semibold">{t(k)}</div>
              </Card>
            ))}
          </div>
        </section>
      </PublicShell>
    );
  },
});
