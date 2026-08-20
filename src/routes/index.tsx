import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/ProductCard";
import { HeroBackground } from "@/components/HeroBackground";

import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, Wrench, Smartphone, Network, Camera, Cable, Code, Shield, Cloud,
  Brain, Palette, Download, GraduationCap, BookOpen, ShieldCheck, Truck, Star, Users, Package, Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";

const iconMap: Record<string, any> = {
  Wrench, Smartphone, Network, Camera, Cable, Code, Shield, Cloud, Brain, Palette, Download, GraduationCap, BookOpen,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "@lkof Services & Tech — Boutique, maintenance, développement, formation" },
      { name: "description", content: "Découvrez @lkof : boutique high-tech, maintenance, développement web/mobile, cybersécurité, cloud et rédaction de mémoire." },
    ],
  }),
  component: Home,
});

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const dur = 1500;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.floor(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{n.toLocaleString("fr-FR")}{suffix}</span>;
}

function Home() {
  const { t, lang } = useI18n();
  const { data: featured } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("is_active", true).eq("is_featured", true).limit(8);
      return data ?? [];
    },
  });
  const { data: services } = useQuery({
    queryKey: ["home-services"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").eq("is_active", true).order("sort_order").limit(8);
      return data ?? [];
    },
  });

  return (
    <PublicShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <HeroBackground />

        <div className="relative mx-auto max-w-7xl px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-white/90 border border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              {t("home.hero.eyebrow")}
            </span>
            <h1 className="mt-6 font-display text-4xl md:text-6xl font-bold text-white leading-[1.05]">
              {t("home.hero.title")}
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-2xl">{t("home.hero.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/boutique">
                <Button size="lg" className="gradient-brand text-brand-foreground border-0 hover:opacity-90 shadow-glow">
                  {t("home.hero.cta_shop")} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
                  {t("home.hero.cta_services")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Users, value: 2400, suffix: "+", key: "home.stats.clients" },
            { icon: Wrench, value: 5800, suffix: "+", key: "home.stats.repairs" },
            { icon: Package, value: 850, suffix: "+", key: "home.stats.products" },
            { icon: Trophy, value: 7, suffix: "", key: "home.stats.years" },
          ].map((s) => (
            <div key={s.key} className="text-center">
              <s.icon className="h-6 w-6 mx-auto text-brand" />
              <div className="mt-2 text-3xl md:text-4xl font-display font-bold text-gradient">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{t(s.key)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold">{t("home.services.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("home.services.subtitle")}</p>
          </div>
          <Link to="/services"><Button variant="ghost">{t("nav.services")} <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(services ?? []).map((s: any) => {
            const Icon = iconMap[s.icon] ?? Wrench;
            return (
              <Link key={s.id} to="/services" className="group">
                <Card className="p-6 h-full border-border/60 hover:border-brand/60 hover:shadow-elegant transition-all">
                  <div className="w-11 h-11 rounded-lg gradient-brand grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5 text-brand-foreground" />
                  </div>
                  <div className="font-semibold text-sm">{lang === "fr" ? s.name_fr : s.name_en}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{lang === "fr" ? s.description_fr : s.description_en}</div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-card/40 border-y">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold">{t("home.products.title")}</h2>
              <p className="mt-2 text-muted-foreground">{t("home.products.subtitle")}</p>
            </div>
            <Link to="/boutique"><Button variant="ghost">{t("nav.shop")} <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(featured ?? []).map((p: any) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">{t("home.why.title")}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, k: "home.why.q1", d: "home.why.q1d" },
            { icon: Star, k: "home.why.q2", d: "home.why.q2d" },
            { icon: Truck, k: "home.why.q3", d: "home.why.q3d" },
            { icon: Users, k: "home.why.q4", d: "home.why.q4d" },
          ].map((v) => (
            <Card key={v.k} className="p-6 text-center border-border/60">
              <v.icon className="h-8 w-8 mx-auto text-brand mb-3" />
              <div className="font-semibold">{t(v.k)}</div>
              <p className="mt-1 text-sm text-muted-foreground">{t(v.d)}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-card/40 border-y">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">{t("home.testimonials.title")}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: "Aïcha K.", role: "Étudiante", text: "Mon mémoire a été livré à temps avec un accompagnement top." },
              { name: "Ibrahim T.", role: "Entrepreneur", text: "Excellent service de dépannage réseau, tout est reparti en quelques heures." },
              { name: "Fatou D.", role: "Directrice", text: "Boutique fiable et équipe très professionnelle." },
            ].map((t2) => (
              <Card key={t2.name} className="p-6 border-border/60">
                <div className="flex gap-0.5 mb-3 text-brand-orange">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-sm">"{t2.text}"</p>
                <div className="mt-4 text-xs">
                  <div className="font-semibold">{t2.name}</div>
                  <div className="text-muted-foreground">{t2.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <Card className="p-10 md:p-16 text-center overflow-hidden relative border-0 gradient-hero text-white">
          <div className="absolute inset-0 gradient-mesh opacity-40" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-display font-bold">Prêt à démarrer votre projet ?</h2>
            <p className="mt-3 text-white/80 max-w-2xl mx-auto">Devis gratuit sous 24h. Notre équipe est à votre écoute.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/devis"><Button size="lg" className="gradient-brand text-brand-foreground border-0">Demander un devis</Button></Link>
              <Link to="/contact"><Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">Nous contacter</Button></Link>
            </div>
          </div>
        </Card>
      </section>
    </PublicShell>
  );
}
