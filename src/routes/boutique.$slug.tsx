import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatXOF, useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { useState } from "react";
import { ShoppingCart, ShieldCheck, Truck, Package } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/boutique/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase.from("products")
        .select("*, categories(id,slug,name_fr,name_en), brands(name)")
        .eq("slug", slug).maybeSingle();
      return data;
    },
  });
  const { data: similar } = useQuery({
    queryKey: ["similar", p?.category_id],
    enabled: !!p?.category_id,
    queryFn: async () => (await supabase.from("products").select("*")
      .eq("is_active", true).eq("category_id", p!.category_id).neq("id", p!.id).limit(4)).data ?? [],
  });

  if (isLoading) return <PublicShell><div className="p-20 text-center">{t("c.loading")}</div></PublicShell>;
  if (!p) return <PublicShell><div className="p-20 text-center">404</div></PublicShell>;

  const name = lang === "fr" ? p.name_fr : p.name_en;
  const desc = lang === "fr" ? p.description_fr : p.description_en;
  const finalPrice = p.promo_price ?? p.price;
  const images = p.images.length ? p.images : ["https://placehold.co/800x800?text=%40lkof"];

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-xs text-muted-foreground mb-6">
          <Link to="/boutique" className="hover:text-foreground">{t("nav.shop")}</Link>
          {p.categories && <> / <Link to="/boutique" search={{ category: p.categories.slug } as any} className="hover:text-foreground">{lang === "fr" ? p.categories.name_fr : p.categories.name_en}</Link></>}
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted/30 border">
              <img src={images[imgIdx]} alt={name} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((im: string, i: number) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`w-16 h-16 rounded-md overflow-hidden border-2 ${imgIdx === i ? "border-brand" : "border-transparent"}`}>
                    <img src={im} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            {p.promo_price != null && <Badge className="bg-brand-orange text-white border-0 mb-2">-{Math.round((1 - Number(p.promo_price)/Number(p.price))*100)}%</Badge>}
            <h1 className="text-3xl font-display font-bold">{name}</h1>
            <div className="mt-2 text-xs text-muted-foreground">
              {t("product.sku")}: {p.sku}{p.brands ? ` • ${t("product.brand")}: ${p.brands.name}` : ""}
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold">{formatXOF(Number(finalPrice), lang)}</span>
              {p.promo_price && <span className="text-muted-foreground line-through">{formatXOF(Number(p.price), lang)}</span>}
            </div>
            <p className="mt-4 text-muted-foreground">{desc}</p>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center border rounded-md">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2">-</button>
                <span className="px-4">{qty}</span>
                <button onClick={() => setQty(Math.min(p.stock, qty + 1))} className="px-3 py-2">+</button>
              </div>
              <Button
                size="lg"
                className="gradient-brand text-brand-foreground border-0 flex-1"
                disabled={p.stock <= 0}
                onClick={() => {
                  add({ id: p.id, name, price: Number(finalPrice), image: images[0], stock: p.stock, sku: p.sku }, qty);
                  toast.success(`${name} → panier`);
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" /> {t("shop.add_cart")}
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
              <div className="flex flex-col items-center text-center p-3 border rounded-md">
                <Package className="h-4 w-4 mb-1 text-brand" />
                {p.stock > 0 ? `${p.stock} ${t("shop.in_stock")}` : t("shop.out_stock")}
              </div>
              <div className="flex flex-col items-center text-center p-3 border rounded-md">
                <ShieldCheck className="h-4 w-4 mb-1 text-brand" />
                {p.warranty_months} {t("product.months")}
              </div>
              <div className="flex flex-col items-center text-center p-3 border rounded-md">
                <Truck className="h-4 w-4 mb-1 text-brand" />
                24-48h
              </div>
            </div>

            {p.features && Object.keys(p.features).length > 0 && (
              <Card className="mt-6 p-4">
                <div className="font-semibold text-sm mb-2">{t("product.features")}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(p.features).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground capitalize">{k}</span>
                      <span>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {similar && similar.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-display font-semibold mb-4">{t("product.similar")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((s: any) => <ProductCard key={s.id} p={s} />)}
            </div>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
