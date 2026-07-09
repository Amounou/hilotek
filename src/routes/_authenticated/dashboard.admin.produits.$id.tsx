import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/produits/$id")({
  component: EditProd,
});

const EMPTY = {
  sku: "", slug: "", name_fr: "", name_en: "", description_fr: "", description_en: "",
  category_id: "", brand_id: "", price: 0, promo_price: null as number | null, stock: 0,
  images: [] as string[], is_active: true, is_featured: false,
};

function EditProd() {
  const { id } = Route.useParams();
  const isNew = id === "nouveau";
  const nav = useNavigate();
  const [f, setF] = useState<any>(EMPTY);
  const [imgs, setImgs] = useState("");

  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: async () => (await supabase.from("categories").select("id,name_fr").order("name_fr")).data ?? [] });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: async () => (await supabase.from("brands").select("id,name").order("name")).data ?? [] });

  useEffect(() => {
    if (isNew) return;
    supabase.from("products").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) { setF(data); setImgs((data.images ?? []).join("\n")); }
    });
  }, [id, isNew]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...f,
      price: Number(f.price), stock: Number(f.stock),
      promo_price: f.promo_price ? Number(f.promo_price) : null,
      images: imgs.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    const { error } = isNew
      ? await supabase.from("products").insert(payload as never)
      : await supabase.from("products").update(payload as never).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Enregistré"); nav({ to: "/dashboard/admin/produits" }); }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-display font-bold">{isNew ? "Nouveau produit" : "Modifier produit"}</h1>
      <Card className="p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>SKU</Label><Input value={f.sku ?? ""} onChange={(e) => setF({ ...f, sku: e.target.value })} required /></div>
          <div><Label>Slug</Label><Input value={f.slug ?? ""} onChange={(e) => setF({ ...f, slug: e.target.value })} required /></div>
          <div><Label>Nom FR</Label><Input value={f.name_fr ?? ""} onChange={(e) => setF({ ...f, name_fr: e.target.value })} required /></div>
          <div><Label>Nom EN</Label><Input value={f.name_en ?? ""} onChange={(e) => setF({ ...f, name_en: e.target.value })} /></div>
          <div>
            <Label>Catégorie</Label>
            <Select value={f.category_id ?? ""} onValueChange={(v) => setF({ ...f, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{(cats ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name_fr}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Marque</Label>
            <Select value={f.brand_id ?? ""} onValueChange={(v) => setF({ ...f, brand_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{(brands ?? []).map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Prix (FCFA)</Label><Input type="number" step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required /></div>
          <div><Label>Promo (FCFA)</Label><Input type="number" step="0.01" value={f.promo_price ?? ""} onChange={(e) => setF({ ...f, promo_price: e.target.value || null })} /></div>
          <div><Label>Stock</Label><Input type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /></div>
        </div>
        <div><Label>Description FR</Label><Textarea rows={3} value={f.description_fr ?? ""} onChange={(e) => setF({ ...f, description_fr: e.target.value })} /></div>
        <div><Label>Description EN</Label><Textarea rows={3} value={f.description_en ?? ""} onChange={(e) => setF({ ...f, description_en: e.target.value })} /></div>
        <div><Label>Images (une URL par ligne)</Label><Textarea rows={3} value={imgs} onChange={(e) => setImgs(e.target.value)} placeholder="https://…" /></div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} />Actif</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_featured} onChange={(e) => setF({ ...f, is_featured: e.target.checked })} />Vedette</label>
        </div>
        <div className="flex gap-2"><Button type="submit" className="gradient-brand text-brand-foreground border-0">Enregistrer</Button><Button type="button" variant="outline" onClick={() => nav({ to: "/dashboard/admin/produits" })}>Annuler</Button></div>
      </Card>
    </form>
  );
}
