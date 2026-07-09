import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  component: () => {
    const { slug } = Route.useParams();
    const { t, lang } = useI18n();
    const { data: p } = useQuery({
      queryKey: ["post", slug],
      queryFn: async () => (await supabase.from("blog_posts").select("*").eq("slug", slug).maybeSingle()).data,
    });
    if (!p) return <PublicShell><div className="p-16 text-center">{t("c.loading")}</div></PublicShell>;
    return (
      <PublicShell>
        <article className="mx-auto max-w-3xl px-4 py-16">
          <Link to="/blog"><Button variant="ghost" size="sm" className="mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Blog</Button></Link>
          <div className="text-xs text-brand font-medium uppercase tracking-wide mb-2">{p.category}</div>
          <h1 className="font-display text-3xl md:text-5xl font-bold">{lang === "fr" ? p.title_fr : p.title_en}</h1>
          {p.cover_url && <img src={p.cover_url} alt="" className="mt-8 rounded-xl w-full aspect-video object-cover" />}
          <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none text-foreground">
            <p>{lang === "fr" ? p.content_fr : p.content_en}</p>
          </div>
        </article>
      </PublicShell>
    );
  },
});
