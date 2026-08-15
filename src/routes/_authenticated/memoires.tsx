import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fr } from "@/lib/labels";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { toast } from "sonner";
import { formatXOF } from "@/lib/i18n";
import { Plus, Download } from "lucide-react";

const STATUSES = ["received","assigned","in_progress","review","completed","delivered","cancelled"];

export const Route = createFileRoute("/_authenticated/memoires")({
  component: () => {
    const qc = useQueryClient();
    const { data } = useQuery({
      queryKey: ["admin-mem"],
      queryFn: async () => (await supabase.from("memoires").select("*").order("created_at", { ascending: false })).data ?? [],
    });
    const upd = async (id: string, patch: any) => {
      const { error } = await supabase.from("memoires").update(patch as never).eq("id", id);
      if (error) toast.error(error.message); else { toast.success("OK"); qc.invalidateQueries({ queryKey: ["admin-mem"] }); }
    };
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [f, setF] = useState({ client_name:"",client_phone:"",client_email:"",theme:"",university:"",level:"",filiere:"",total_amount:"",deposit:"",notes:"" });
    const create = async (e: React.FormEvent) => {
      e.preventDefault();
      setUploading(true);
      try {
        let document_url: string | null = null;
        if (file) {
          const allowed = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
          const ext = file.name.split(".").pop()?.toLowerCase();
          if (!allowed.includes(file.type) && !["pdf","doc","docx"].includes(ext ?? "")) {
            toast.error("Format non supporté (PDF ou Word uniquement)"); setUploading(false); return;
          }
          if (file.size > 20 * 1024 * 1024) {
            toast.error("Fichier trop volumineux (20 Mo max)"); setUploading(false); return;
          }
          const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const { error: upErr } = await supabase.storage.from("memoire-documents").upload(path, file, { upsert: false, contentType: file.type });
          if (upErr) { toast.error(upErr.message); setUploading(false); return; }
          document_url = path;
        }
        const total = Number(f.total_amount || 0);
        const dep = Number(f.deposit || 0);
        const { error } = await supabase.from("memoires").insert({
          memoire_number: "", tracking_token: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
          ...f, total_amount: total, deposit: dep, balance: total - dep,
          ...(document_url ? { document_url } : {}),
        } as never);
        if (error) toast.error(error.message);
        else {
          toast.success("Créé"); setOpen(false); setFile(null);
          setF({ client_name:"",client_phone:"",client_email:"",theme:"",university:"",level:"",filiere:"",total_amount:"",deposit:"",notes:"" });
          qc.invalidateQueries({ queryKey: ["admin-mem"] });
        }
      } finally { setUploading(false); }
    };
    const downloadDoc = async (m: any) => {
      if (!m.document_url) return;
      const { data, error } = await supabase.storage.from("memoire-documents").createSignedUrl(m.document_url, 60);
      if (error || !data) { toast.error(error?.message ?? "Erreur"); return; }
      window.open(data.signedUrl, "_blank");
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-display font-bold">Mémoires</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gradient-brand text-brand-foreground border-0"><Plus className="h-4 w-4 mr-1" />Nouveau</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nouveau mémoire</DialogTitle></DialogHeader>
              <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
                <div><Label>Client</Label><Input required value={f.client_name} onChange={(e)=>setF({...f, client_name:e.target.value})}/></div>
                <div><Label>Téléphone</Label><Input required value={f.client_phone} onChange={(e)=>setF({...f, client_phone:e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Email</Label><Input type="email" value={f.client_email} onChange={(e)=>setF({...f, client_email:e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Thème</Label><Textarea required value={f.theme} onChange={(e)=>setF({...f, theme:e.target.value})}/></div>
                <div><Label>Université</Label><Input value={f.university} onChange={(e)=>setF({...f, university:e.target.value})}/></div>
                <div><Label>Niveau</Label><Input value={f.level} onChange={(e)=>setF({...f, level:e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Filière</Label><Input value={f.filiere} onChange={(e)=>setF({...f, filiere:e.target.value})}/></div>
                <div><Label>Montant total</Label><Input type="number" required value={f.total_amount} onChange={(e)=>setF({...f, total_amount:e.target.value})}/></div>
                <div><Label>Acompte</Label><Input type="number" value={f.deposit} onChange={(e)=>setF({...f, deposit:e.target.value})}/></div>
                <div className="sm:col-span-2">
                  <Label>Document (PDF ou Word)</Label>
                  <Input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
                  {file && <p className="text-xs text-muted-foreground mt-1">{file.name} — {(file.size/1024).toFixed(0)} Ko</p>}
                </div>
                <Button className="sm:col-span-2 gradient-brand text-brand-foreground border-0" type="submit" disabled={uploading}>{uploading ? "Envoi…" : "Créer"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Client</TableHead><TableHead>Thème</TableHead><TableHead>Total / Solde</TableHead><TableHead>Progression</TableHead><TableHead>Statut</TableHead><TableHead>Doc</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.memoire_number}</TableCell>
                  <TableCell>{m.client_name}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs">{m.theme}</TableCell>
                  <TableCell className="text-xs">{formatXOF(Number(m.total_amount))}<div className="text-muted-foreground">Solde: {formatXOF(Number(m.balance))}</div></TableCell>
                  <TableCell className="w-40"><Progress value={m.progress ?? 0} /><input type="number" min="0" max="100" defaultValue={m.progress ?? 0} onBlur={(e)=>upd(m.id, { progress: Number(e.target.value) })} className="mt-1 w-20 rounded border px-2 py-1 text-xs" /></TableCell>
                  <TableCell>
                    <Select value={m.status} onValueChange={(v) => upd(m.id, { status: v })}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{fr(s)}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {m.document_url ? (
                      <Button size="icon" variant="ghost" title="Télécharger" onClick={() => downloadDoc(m)}><Download className="h-4 w-4" /></Button>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  },
});
