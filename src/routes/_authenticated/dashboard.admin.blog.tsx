import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const EMPTY = { slug:"", title_fr:"", title_en:"", excerpt_fr:"", excerpt_en:"", content_fr:"", content_en:"", category:"News", cover_url:"", is_published:true };

export const Route = createFileRoute("/_authenticated/dashboard/admin/blog")({
  component: () => {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [f, setF] = useState<any>(EMPTY);
    const { data } = useQuery({ queryKey: ["admin-blog"], queryFn: async () => (await supabase.from("blog_posts").select("*").order("created_at",{ascending:false})).data ?? [] });
    const save = async (e: React.FormEvent) => {
      e.preventDefault();
      const payload = { ...f, published_at: f.is_published ? new Date().toISOString() : null };
      const { error } = f.id
        ? await supabase.from("blog_posts").update(payload as never).eq("id", f.id)
        : await supabase.from("blog_posts").insert(payload as never);
      if (error) toast.error(error.message);
      else { toast.success("OK"); setOpen(false); setF(EMPTY); qc.invalidateQueries({ queryKey: ["admin-blog"] }); }
    };
    const del = async (id: string) => {
      if (!confirm("Supprimer ?")) return;
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-blog"] });
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-display font-bold">Blog</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gradient-brand text-brand-foreground border-0" onClick={() => setF(EMPTY)}><Plus className="h-4 w-4 mr-1" />Nouvel article</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
              <DialogHeader><DialogTitle>{f.id ? "Modifier" : "Nouvel"} article</DialogTitle></DialogHeader>
              <form onSubmit={save} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Slug</Label><Input required value={f.slug} onChange={(e)=>setF({...f,slug:e.target.value})}/></div>
                  <div><Label>Catégorie</Label><Input value={f.category} onChange={(e)=>setF({...f,category:e.target.value})}/></div>
                  <div><Label>Titre FR</Label><Input required value={f.title_fr} onChange={(e)=>setF({...f,title_fr:e.target.value})}/></div>
                  <div><Label>Title EN</Label><Input value={f.title_en} onChange={(e)=>setF({...f,title_en:e.target.value})}/></div>
                </div>
                <div><Label>Cover URL</Label><Input value={f.cover_url} onChange={(e)=>setF({...f,cover_url:e.target.value})}/></div>
                <div><Label>Extrait FR</Label><Textarea rows={2} value={f.excerpt_fr} onChange={(e)=>setF({...f,excerpt_fr:e.target.value})}/></div>
                <div><Label>Contenu FR</Label><Textarea rows={8} value={f.content_fr} onChange={(e)=>setF({...f,content_fr:e.target.value})}/></div>
                <div><Label>Contenu EN</Label><Textarea rows={4} value={f.content_en} onChange={(e)=>setF({...f,content_en:e.target.value})}/></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_published} onChange={(e)=>setF({...f,is_published:e.target.checked})}/>Publié</label>
                <Button type="submit" className="gradient-brand text-brand-foreground border-0">Enregistrer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Titre</TableHead><TableHead>Catégorie</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell><button className="text-left hover:text-brand" onClick={() => { setF(p); setOpen(true); }}>{p.title_fr}</button></TableCell>
                  <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                  <TableCell>{p.is_published ? <Badge>Publié</Badge> : <Badge variant="secondary">Brouillon</Badge>}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={()=>del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  },
});
