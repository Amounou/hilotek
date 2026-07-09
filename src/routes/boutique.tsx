import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

type Search = { category?: string; q?: string };

export const Route = createFileRoute("/boutique")({
  head: () => ({
    meta: [
      { title: "Boutique — @lkof" },
      { name: "description", content: "Ordinateurs, téléphones, tablettes, accessoires, gaming, imprimantes, réseau et logiciels." },
      { property: "og:title", content: "Boutique — @lkof" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: typeof s.category === "string" ? s.category : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: Shop,
});

function Shop() {
  const { t, lang } = useI18n();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");

  const { data: cats } = useQuery({
    queryKey: ["cats"],
    queryFn: async () => (await supabase.from("categories").select("*").eq("is_active", true).order("sort_order")).data ?? [],
  });
  const { data: products } = useQuery({
    queryKey: ["products", search.category],
    queryFn: async () => {
      let query = supabase.from("products").select("*, categories(slug)").eq("is_active", true);
      if (search.category) {
        const cat = cats?.find((c: any) => c.slug === search.category);
        if (cat) query = query.eq("category_id", cat.id);
      }
      const { data } = await query.order("is_featured", { ascending: false });
      return data ?? [];
    },
    enabled: !!cats || !search.category,
  });

  const filtered = useMemo(() => {
    if (!q) return products ?? [];
    const s = q.toLowerCase();
    return (products ?? []).filter((p: any) =>
      p.name_fr.toLowerCase().includes(s) ||
      p.name_en.toLowerCase().includes(s) ||
      p.sku.toLowerCase().includes(s)
    );
  }, [products, q]);

  return (
    <PublicShell>
      <section className="border-b relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 py-14">
          <h1 className="text-3xl md:text-4xl font-display font-bold">{t("shop.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("shop.subtitle")}</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("shop.search")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge
            variant={!search.category ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => navigate({ search: { q: q || undefined } as any })}
          >
            {t("shop.all")}
          </Badge>
          {(cats ?? []).map((c: any) => (
            <Badge
              key={c.id}
              variant={search.category === c.slug ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => navigate({ search: { category: c.slug, q: q || undefined } as any })}
            >
              {lang === "fr" ? c.name_fr : c.name_en}
            </Badge>
          ))}
        </div>
        <div className="mt-8">
          {filtered.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">{t("shop.no_products")}</div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p: any) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
