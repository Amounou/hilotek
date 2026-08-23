import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { useCart } from "@/lib/cart";
import { formatXOF, useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Commande — HiloTek" }] }),
  component: Checkout,
});

const METHODS = [
  { v: "orange_money", l: "Orange Money" },
  { v: "mtn_money", l: "MTN Money" },
  { v: "wave", l: "Wave" },
  { v: "card", l: "Carte bancaire" },
  { v: "cash", l: "Espèces à la livraison" },
  { v: "bank_transfer", l: "Virement" },
] as const;

function Checkout() {
  const { t, lang } = useI18n();
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: user?.email ?? "", phone: "", address: "", notes: "",
    method: "orange_money" as (typeof METHODS)[number]["v"],
  });

  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal > 0 ? 3000 : 0;
  const total = subtotal + tax + shipping;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("place_order" as never, {
      _payload: {
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        shipping_address: form.address,
        notes: form.notes,
        payment_method: form.method,
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      },
    } as never);
    setLoading(false);
    if (error) { toast.error(error.message ?? t("c.error")); return; }
    const res: any = data;
    clear();
    toast.success(`${t("co.success")} : ${res?.order_number}`);
    nav({ to: "/merci", search: { order: res?.order_number } as any });
  };

  if (items.length === 0) {
    return (
      <PublicShell>
        <div className="p-20 text-center text-muted-foreground">Votre panier est vide.</div>
      </PublicShell>
    );
  }


  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-display font-bold mb-6">{t("co.title")}</h1>
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="font-semibold mb-4">{t("co.contact")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>{t("co.name")}</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>{t("co.email")}</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>{t("co.phone")}</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
            </Card>
            <Card className="p-6">
              <h2 className="font-semibold mb-4">{t("co.shipping")}</h2>
              <div><Label>{t("co.address")}</Label><Textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="mt-4"><Label>{t("co.notes")}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </Card>
            <Card className="p-6">
              <h2 className="font-semibold mb-4">{t("co.payment")}</h2>
              <RadioGroup value={form.method} onValueChange={(v) => setForm({ ...form, method: v as any })}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {METHODS.map((m) => (
                    <label key={m.v} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent ${form.method === m.v ? "border-brand ring-1 ring-brand" : ""}`}>
                      <RadioGroupItem value={m.v} />
                      <span className="text-sm">{m.l}</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </Card>
          </div>
          <Card className="p-6 h-fit sticky top-20">
            <h2 className="font-semibold mb-3">Récapitulatif</h2>
            <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground truncate">{i.quantity}× {i.name}</span>
                  <span className="shrink-0">{formatXOF(i.price * i.quantity, lang)}</span>
                </div>
              ))}
            </div>
            <div className="my-3 border-t" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>{t("cart.subtotal")}</span><span>{formatXOF(subtotal, lang)}</span></div>
              <div className="flex justify-between"><span>{t("cart.tax")}</span><span>{formatXOF(tax, lang)}</span></div>
              <div className="flex justify-between"><span>{t("cart.shipping")}</span><span>{formatXOF(shipping, lang)}</span></div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t"><span>{t("cart.total")}</span><span>{formatXOF(total, lang)}</span></div>
            </div>
            <Button type="submit" disabled={loading} size="lg" className="w-full mt-4 gradient-brand text-brand-foreground border-0">
              {loading ? t("c.loading") : t("co.place")}
            </Button>
          </Card>
        </form>
      </div>
    </PublicShell>
  );
}
