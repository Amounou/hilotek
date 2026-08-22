import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatXOF, useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name_fr: string;
  name_en: string;
  price: number;
  promo_price: number | null;
  stock: number;
  images: string[];
  is_featured?: boolean;
};

export function ProductCard({ p }: { p: Product }) {
  const { t, lang } = useI18n();
  const { add } = useCart();
  const name = lang === "fr" ? p.name_fr : p.name_en;
  const finalPrice = p.promo_price ?? p.price;
  const inStock = p.stock > 0;

  return (
    <Card className="group overflow-hidden border-border/60 hover:shadow-elegant transition-all duration-300 flex flex-col">
      <Link to="/boutique/$slug" params={{ slug: p.slug }} className="relative aspect-square overflow-hidden bg-muted/30 block">
        <img
          src={p.images[0] ?? "https://placehold.co/600x600?text=HiloTek"}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {p.promo_price && (
          <Badge className="absolute top-2 left-2 bg-brand-orange text-white border-0">{t("shop.promo")}</Badge>
        )}
        {!inStock && (
          <Badge variant="secondary" className="absolute top-2 right-2">{t("shop.out_stock")}</Badge>
        )}
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <Link to="/boutique/$slug" params={{ slug: p.slug }} className="text-sm font-medium line-clamp-2 hover:text-brand transition-colors">
          {name}
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold">{formatXOF(finalPrice, lang)}</span>
          {p.promo_price && (
            <span className="text-xs text-muted-foreground line-through">{formatXOF(p.price, lang)}</span>
          )}
        </div>
        <div className="mt-3 flex gap-2 mt-auto pt-3">
          <Button
            size="sm"
            className="flex-1 gradient-brand text-brand-foreground border-0"
            disabled={!inStock}
            onClick={() => {
              add({ id: p.id, name, price: finalPrice, image: p.images[0], stock: p.stock, sku: p.sku });
              toast.success(`${name} → panier`);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {t("shop.add_cart")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
