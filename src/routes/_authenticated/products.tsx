import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { formatXOF } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/products")({
  component: ProdAdmin,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const EMPTY = {
  id: null as string | null,
  sku: "", slug: "", name_fr: "", description_fr: "",
  category_id: "", price: 0, promo_price: null as any, stock: 0,
  images: [] as string[], is_active: true, is_featured: false,
};

function ProdAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: ["admin-products", q],
    queryFn: async () => {
      let query = supabase.from("products").select("*, categories(name_fr), brands(name)").order("created_at", { ascending: false });
      if (q) query = query.ilike("name_fr", `%${q}%`);
      return (await query).data ?? [];
    },
  });
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: async () => (await supabase.from("categories").select("id,name_fr").order("name_fr")).data ?? [] });

  const openNew = () => { setF(EMPTY); setOpen(true); };
  const openEdit = (p: any) => {
    setF({
      id: p.id, sku: p.sku ?? "", slug: p.slug ?? "", name_fr: p.name_fr ?? "",
      description_fr: p.description_fr ?? "", category_id: p.category_id ?? "",
      price: p.price ?? 0, promo_price: p.promo_price ?? null, stock: p.stock ?? 0,
      images: p.images ?? [], is_active: !!p.is_active, is_featured: !!p.is_featured,
    });
    setOpen(true);
  };

  const toggle = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("products").update({ is_active: !is_active } as never).eq("id", id);
    if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ["admin-products"] }); }
  };
  const del = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["admin-products"] }); }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = await Promise.all(Array.from(files).slice(0, 6).map(file => new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(file);
    })));
    setF((prev: any) => ({ ...prev, images: [...(prev.images ?? []), ...arr] }));
  };

  const removeImage = (idx: number) => setF((prev: any) => ({ ...prev, images: prev.images.filter((_: any, i: number) => i !== idx) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name_fr.trim()) { toast.error("Le nom est requis"); return; }
    setSaving(true);
    const payload: any = {
      sku: f.sku || `SKU-${Date.now()}`,
      slug: f.slug || slugify(f.name_fr),
      name_fr: f.name_fr,
      description_fr: f.description_fr || null,
      category_id: f.category_id || null,
      price: Number(f.price) || 0,
      stock: Number(f.stock) || 0,
      promo_price: f.promo_price ? Number(f.promo_price) : null,
      images: f.images ?? [],
      is_active: f.is_active,
      is_featured: f.is_featured,
    };
    const { error } = f.id
      ? await supabase.from("products").update(payload).eq("id", f.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(f.id ? "Produit mis à jour" : "Produit créé");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  useEffect(() => {
    if (!open) return;
    // auto-slug while typing name (only if slug empty)
  }, [open]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-display font-bold">Produits</h1>
        <Button onClick={openNew} className="gradient-brand text-brand-foreground border-0">
          <Plus className="h-4 w-4 mr-1" />Nouveau
        </Button>
      </div>
      <Card className="p-3"><Input placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} /></Card>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Catégorie</TableHead><TableHead>Prix</TableHead><TableHead>Stock</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {(data ?? []).map((p: any) => (
              <TableRow key={p.id}>
                <TableCell><div className="font-medium">{p.name_fr}</div><div className="text-xs text-muted-foreground">{p.sku}</div></TableCell>
                <TableCell className="text-xs">{p.categories?.name_fr}</TableCell>
                <TableCell>{formatXOF(Number(p.promo_price ?? p.price))}</TableCell>
                <TableCell><Badge variant={p.stock > 5 ? "secondary" : "destructive"}>{p.stock}</Badge></TableCell>
                <TableCell><button onClick={() => toggle(p.id, p.is_active)}><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Actif" : "Inactif"}</Badge></button></TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {(data ?? []).length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun produit</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{f.id ? "Modifier produit" : "Nouveau produit"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-5 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nom</Label>
                <Input value={f.name_fr} onChange={(e) => setF({ ...f, name_fr: e.target.value })} required />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="auto" />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea rows={4} value={f.description_fr} onChange={(e) => setF({ ...f, description_fr: e.target.value })} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Prix (FCFA)</Label>
                <Input type="number" step="1" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required />
              </div>
              <div>
                <Label>Prix barré</Label>
                <Input type="number" step="1" value={f.promo_price ?? ""} onChange={(e) => setF({ ...f, promo_price: e.target.value || null })} />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Catégorie</Label>
              <Select value={f.category_id || undefined} onValueChange={(v) => setF({ ...f, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {(cats ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name_fr}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Images du produit</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {(f.images ?? []).map((src: string, i: number) => (
                  <div key={i} className="relative w-28 h-28 rounded-lg overflow-hidden border group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-28 h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-brand hover:text-brand transition"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Ajouter</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch checked={f.is_featured} onCheckedChange={(v) => setF({ ...f, is_featured: v })} />
                <Label className="mb-0">En vedette</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} />
                <Label className="mb-0">Actif</Label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="gradient-brand text-brand-foreground border-0">
                {saving ? "…" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* legacy link kept for compatibility */}
      <Link to="/products" className="hidden" />
    </div>
  );
}
