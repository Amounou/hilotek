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

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesAdmin,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const EMPTY = {
  id: null as string | null,
  slug: "", name_fr: "", description_fr: "", image_url: "",
  sort_order: 0, is_active: true,
};

function CategoriesAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () =>
      (await supabase.from("categories").select("*").order("sort_order").order("name_fr")).data ?? [],
  });

  const rows = (data ?? []).filter((c: any) =>
    !q || String(c.name_fr).toLowerCase().includes(q.toLowerCase()),
  );

  const openNew = () => { setF(EMPTY); setOpen(true); };
  const openEdit = (c: any) => {
    setF({
      id: c.id, slug: c.slug ?? "", name_fr: c.name_fr ?? "",
      description_fr: c.description_fr ?? "", image_url: c.image_url ?? "",
      sort_order: c.sort_order ?? 0, is_active: !!c.is_active,
    });
    setOpen(true);
  };

  const toggle = async (c: any) => {
    const { error } = await supabase.from("categories").update({ is_active: !c.is_active } as never).eq("id", c.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimée"); qc.invalidateQueries({ queryKey: ["admin-categories"] }); }
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
      image_url: f.image_url || null,
      sort_order: Number(f.sort_order) || 0,
      is_active: f.is_active,
    };
    const { error } = f.id
      ? await supabase.from("categories").update(payload).eq("id", f.id)
      : await supabase.from("categories").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(f.id ? "Catégorie mise à jour" : "Catégorie créée");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["cats"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-display font-bold">Catégories</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} className="w-48" />
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nouvelle</Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Ordre</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name_fr}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                <TableCell>{c.sort_order}</TableCell>
                <TableCell>
                  <Badge variant={c.is_active ? "default" : "outline"} className="cursor-pointer" onClick={() => toggle(c)}>
                    {c.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => del(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucune catégorie</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{f.id ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={f.name_fr} onChange={(e) => setF({ ...f, name_fr: e.target.value })} placeholder="Ordinateurs portables" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="auto" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={f.description_fr} onChange={(e) => setF({ ...f, description_fr: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Image (URL)</Label>
                <Input value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ordre d'affichage</Label>
                <Input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} />
              <Label>Active</Label>
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
