import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/blog")({
  head: () => ({ meta: [{ title: "Blog — @lkof" }, { name: "description", content: "Guides, actualités et conseils tech." }] }),
  component: () => {
    const { t, lang } = useI18n();
    const { data } = useQuery({
      queryKey: ["posts"],
      queryFn: async () => (await supabase.from("blog_posts").select("*").eq("is_published", true).order("published_at", { ascending: false })).data ?? [],
    });
    return (
      <PublicShell>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-center mb-10">Blog</h1>
          <div className="grid gap-6 md:grid-cols-3">
            {(data ?? []).map((p: any) => (
              <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }}>
                <Card className="overflow-hidden hover:shadow-elegant transition-all group">
                  {p.cover_url && <div className="aspect-video overflow-hidden"><img src={p.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" /></div>}
                  <div className="p-5">
                    <div className="text-xs text-brand font-medium uppercase tracking-wide">{p.category}</div>
                    <div className="mt-2 font-semibold">{lang === "fr" ? p.title_fr : p.title_en}</div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{lang === "fr" ? p.excerpt_fr : p.excerpt_en}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </PublicShell>
    );
  },
});
