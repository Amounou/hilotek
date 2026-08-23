import { createFileRoute } from "@tanstack/react-router";
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
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatXOF } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/services")({
  component: ServicesAdmin,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const EMPTY = {
  id: null as string | null,
  slug: "", name_fr: "", description_fr: "", category: "", icon: "",
  image_url: "", price_from: "" as any, sort_order: 0, is_active: true,
};

function ServicesAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () =>
      (await supabase.from("services").select("*").order("sort_order").order("name_fr")).data ?? [],
  });

  const rows = (data ?? []).filter((s: any) =>
    !q || String(s.name_fr).toLowerCase().includes(q.toLowerCase()),
  );

  const openNew = () => { setF(EMPTY); setOpen(true); };
  const openEdit = (s: any) => {
    setF({
      id: s.id, slug: s.slug ?? "", name_fr: s.name_fr ?? "", description_fr: s.description_fr ?? "",
      category: s.category ?? "", icon: s.icon ?? "", image_url: s.image_url ?? "",
      price_from: s.price_from ?? "", sort_order: s.sort_order ?? 0, is_active: !!s.is_active,
    });
    setOpen(true);
  };

  const toggle = async (s: any) => {
    const { error } = await supabase.from("services").update({ is_active: !s.is_active } as never).eq("id", s.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-services"] });
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer ce service ?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["admin-services"] }); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name_fr.trim()) { toast.error("Le nom est requis"); return; }
    setSaving(true);
    const payload: any = {
      slug: f.slug || slugify(f.name_fr),
      name_fr: f.name_fr,
      name_en: f.name_fr,
      description_fr: f.description_fr || null,
      description_en: f.description_fr || null,
      category: f.category || null,
      icon: f.icon || null,
      image_url: f.image_url || null,
      price_from: f.price_from === "" || f.price_from === null ? null : Number(f.price_from),
      sort_order: Number(f.sort_order) || 0,
      is_active: f.is_active,
    };
    const { error } = f.id
      ? await supabase.from("services").update(payload).eq("id", f.id)
      : await supabase.from("services").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(f.id ? "Service mis à jour" : "Service créé");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-services"] });
    qc.invalidateQueries({ queryKey: ["services"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-display font-bold">Services</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} className="w-48" />
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nouveau</Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>À partir de</TableHead>
              <TableHead>Ordre</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name_fr}</TableCell>
                <TableCell className="text-muted-foreground">{s.category ?? "—"}</TableCell>
                <TableCell>{s.price_from ? formatXOF(Number(s.price_from)) : "—"}</TableCell>
                <TableCell>{s.sort_order}</TableCell>
                <TableCell>
                  <Badge variant={s.is_active ? "default" : "outline"} className="cursor-pointer" onClick={() => toggle(s)}>
                    {s.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun service</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{f.id ? "Modifier le service" : "Nouveau service"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={f.name_fr} onChange={(e) => setF({ ...f, name_fr: e.target.value })} placeholder="Maintenance informatique" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="auto" />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="maintenance" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={f.description_fr} onChange={(e) => setF({ ...f, description_fr: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prix à partir de (XOF)</Label>
                <Input type="number" value={f.price_from} onChange={(e) => setF({ ...f, price_from: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ordre d'affichage</Label>
                <Input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Icône (lucide)</Label>
                <Input value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} placeholder="Wrench" />
              </div>
              <div className="space-y-2">
                <Label>Image (URL)</Label>
                <Input value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} />
              <Label>Actif</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
