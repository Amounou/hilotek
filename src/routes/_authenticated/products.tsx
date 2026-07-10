import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatXOF } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/products")({
  component: ProdAdmin,
});

function ProdAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["admin-products", q],
    queryFn: async () => {
      let query = supabase.from("products").select("*, categories(name_fr), brands(name)").order("created_at", { ascending: false });
      if (q) query = query.ilike("name_fr", `%${q}%`);
      return (await query).data ?? [];
    },
  });
  const toggle = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("products").update({ is_active: !is_active } as never).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("OK"); qc.invalidateQueries({ queryKey: ["admin-products"] }); }
  };
  const del = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["admin-products"] }); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-display font-bold">Produits</h1>
        <Link to="/products/nouveau"><Button className="gradient-brand text-brand-foreground border-0"><Plus className="h-4 w-4 mr-1" />Nouveau</Button></Link>
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
                  <Link to="/products/$id" params={{ id: p.id }}><Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button></Link>
                  <Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
