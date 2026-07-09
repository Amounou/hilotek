import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const STATUSES = ["received","diagnosis","waiting_parts","in_repair","completed","delivered","cancelled"];

export const Route = createFileRoute("/_authenticated/dashboard/admin/reparations")({
  component: () => {
    const qc = useQueryClient();
    const { data } = useQuery({
      queryKey: ["admin-reps"],
      queryFn: async () => (await supabase.from("repairs").select("*").order("created_at", { ascending: false })).data ?? [],
    });
    const upd = async (id: string, status: string) => {
      const { error } = await supabase.from("repairs").update({ status } as never).eq("id", id);
      if (error) toast.error(error.message); else { toast.success("OK"); qc.invalidateQueries({ queryKey: ["admin-reps"] }); }
    };
    const [open, setOpen] = useState(false);
    const [f, setF] = useState({ client_name: "", client_phone: "", client_email: "", device_type: "", brand: "", model: "", issue_description: "", diagnosis: "", estimated_cost: "", deposit: "" });
    const create = async (e: React.FormEvent) => {
      e.preventDefault();
      const { error } = await supabase.from("repairs").insert({
        repair_number: "", tracking_token: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        ...f,
        estimated_cost: f.estimated_cost ? Number(f.estimated_cost) : null,
        deposit: f.deposit ? Number(f.deposit) : 0,
      } as never);
      if (error) toast.error(error.message);
      else { toast.success("Dossier créé"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-reps"] }); }
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-display font-bold">Réparations</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gradient-brand text-brand-foreground border-0"><Plus className="h-4 w-4 mr-1" />Nouvelle</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nouveau dossier</DialogTitle></DialogHeader>
              <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
                <div><Label>Client</Label><Input required value={f.client_name} onChange={(e) => setF({ ...f, client_name: e.target.value })} /></div>
                <div><Label>Téléphone</Label><Input required value={f.client_phone} onChange={(e) => setF({ ...f, client_phone: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Email</Label><Input type="email" value={f.client_email} onChange={(e) => setF({ ...f, client_email: e.target.value })} /></div>
                <div><Label>Type</Label><Input required value={f.device_type} onChange={(e) => setF({ ...f, device_type: e.target.value })} /></div>
                <div><Label>Marque</Label><Input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Modèle</Label><Input value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Panne</Label><Textarea required value={f.issue_description} onChange={(e) => setF({ ...f, issue_description: e.target.value })} /></div>
                <div><Label>Devis (FCFA)</Label><Input type="number" value={f.estimated_cost} onChange={(e) => setF({ ...f, estimated_cost: e.target.value })} /></div>
                <div><Label>Acompte</Label><Input type="number" value={f.deposit} onChange={(e) => setF({ ...f, deposit: e.target.value })} /></div>
                <Button className="sm:col-span-2 gradient-brand text-brand-foreground border-0" type="submit">Créer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Client</TableHead><TableHead>Appareil</TableHead><TableHead>Statut</TableHead><TableHead>Jeton</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.repair_number}</TableCell>
                  <TableCell>{r.client_name}<div className="text-xs text-muted-foreground">{r.client_phone}</div></TableCell>
                  <TableCell className="text-xs">{r.device_type} {r.brand} {r.model}</TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={(v) => upd(r.id, v)}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.tracking_token}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  },
});
