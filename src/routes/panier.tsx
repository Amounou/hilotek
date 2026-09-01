import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { useCart } from "@/lib/cart";
import { formatXOF, useI18n } from "@/lib/i18n";
import { useTaxRate } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/panier")({
  head: () => ({ meta: [{ title: "Panier — HiloTek" }, { name: "description", content: "Votre panier HiloTek." }] }),
  component: CartPage,
});

function CartPage() {
  const { t, lang } = useI18n();
  const { items, remove, setQty, subtotal } = useCart();
  const taxRate = useTaxRate();
  const tax = Math.round((subtotal * taxRate) / 100);
  const shipping = subtotal > 0 ? 3000 : 0;
  const total = subtotal + tax + shipping;

  if (items.length === 0) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-display font-bold mb-3">{t("cart.title")}</h1>
          <p className="text-muted-foreground mb-6">{t("cart.empty")}</p>
          <Link to="/boutique"><Button className="gradient-brand text-brand-foreground border-0">{t("cart.continue")}</Button></Link>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-display font-bold mb-6">{t("cart.title")}</h1>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            {items.map((i) => (
              <Card key={i.id} className="p-4 flex gap-4 items-center">
                {i.image && <img src={i.image} alt={i.name} className="w-20 h-20 object-cover rounded-md" />}
                <div className="flex-1">
                  <div className="font-medium text-sm">{i.name}</div>
                  <div className="text-xs text-muted-foreground">{formatXOF(i.price, lang)} × {i.quantity}</div>
                  <div className="mt-2 flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i.id, i.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                    <span className="px-3 text-sm">{i.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i.id, i.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatXOF(i.price * i.quantity, lang)}</div>
                  <Button size="icon" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-6 h-fit sticky top-20">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("cart.subtotal")}</span><span>{formatXOF(subtotal, lang)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("cart.tax")} ({taxRate}%)</span><span>{formatXOF(tax, lang)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("cart.shipping")}</span><span>{formatXOF(shipping, lang)}</span></div>
              <div className="my-2 border-t" />
              <div className="flex justify-between text-lg font-semibold"><span>{t("cart.total")}</span><span>{formatXOF(total, lang)}</span></div>
            </div>
            <div className="mt-3 flex gap-2">
              <Input placeholder={t("cart.coupon")} />
              <Button variant="outline">{t("cart.apply")}</Button>
            </div>
            <Link to="/checkout" className="block mt-4">
              <Button size="lg" className="w-full gradient-brand text-brand-foreground border-0">{t("cart.checkout")}</Button>
            </Link>
            <Link to="/boutique" className="block mt-2">
              <Button variant="ghost" className="w-full">{t("cart.continue")}</Button>
            </Link>
          </Card>
        </div>
      </div>
    </PublicShell>
  );
}
