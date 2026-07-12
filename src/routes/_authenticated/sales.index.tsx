import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Printer, Copy, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { formatXOF } from "@/lib/i18n";
import { generateSalePdf } from "@/lib/sales-pdf";

export const Route = createFileRoute("/_authenticated/sales/")({
  component: SalesList,
});

function SalesList() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["sales-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, sale_items(id, product_name, quantity, unit_price, line_total, product_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return (data ?? []).filter((s: any) => {
      if (status !== "all" && s.status !== status) return false;
      if (from && new Date(s.sale_date) < new Date(from)) return false;
      if (to && new Date(s.sale_date) > new Date(to + "T23:59:59")) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (
          !String(s.invoice_number).toLowerCase().includes(needle) &&
          !String(s.client_name).toLowerCase().includes(needle)
        ) return false;
      }
      return true;
    });
  }, [data, q, status, from, to]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc: any, s: any) => {
        acc.count++;
        acc.ht += Number(s.subtotal);
        acc.ttc += Number(s.total);
        return acc;
      },
      { count: 0, ht: 0, ttc: 0 },
    );
  }, [filtered]);

  const del = async (id: string) => {
    if (!confirm("Supprimer définitivement cette vente ? Le stock sera restauré.")) return;
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Vente supprimée"); qc.invalidateQueries({ queryKey: ["sales-list"] }); }
  };

  const buildPdf = async (s: any, mode: "save" | "print") => {
    const { data: settings } = await supabase.rpc("get_public_settings");
    const c: any = settings ?? {};
    await generateSalePdf(
      {
        invoice_number: s.invoice_number,
        sale_date: s.sale_date,
        client_name: s.client_name,
        client_email: s.client_email,
        client_phone: s.client_phone,
        seller_name: s.seller_name,
        subtotal: Number(s.subtotal),
        tax_rate: Number(s.tax_rate),
        tax_amount: Number(s.tax_amount),
        total: Number(s.total),
        notes: s.notes,
        items: (s.sale_items ?? []).map((i: any) => ({
          product_name: i.product_name,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          line_total: Number(i.line_total),
        })),
      },
      {
        company_name: c.company_name ?? "@lkof Services & Tech",
        address: c.address, phone: c.phone, email: c.email,
      },
      mode,
    );
  };
  const print = (s: any) => buildPdf(s, "print");
  const download = (s: any) => buildPdf(s, "save");

  const duplicate = async (s: any) => {
    nav({ to: "/sales/new", search: { from: s.id } as any });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold">Ventes</h1>
          <p className="text-sm text-muted-foreground">{totals.count} vente(s) — HT {formatXOF(totals.ht)} · TTC {formatXOF(totals.ttc)}</p>
        </div>
        <Link to="/sales/new">
          <Button className="gradient-brand text-brand-foreground border-0">
            <Plus className="h-4 w-4 mr-1" />Nouvelle Vente
          </Button>
        </Link>
      </div>

      <Card className="p-3 grid gap-2 md:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="N° facture, client…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Du" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Au" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="completed">Complétée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Facture</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Articles</TableHead>
              <TableHead className="text-right">HT</TableHead>
              <TableHead className="text-right">TVA</TableHead>
              <TableHead className="text-right">TTC</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (<TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Chargement…</TableCell></TableRow>)}
            {!isLoading && filtered.length === 0 && (<TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Aucune vente</TableCell></TableRow>)}
            {filtered.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.invoice_number}</TableCell>
                <TableCell className="text-sm">{new Date(s.sale_date).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell className="text-sm">{s.client_name}</TableCell>
                <TableCell className="text-right">{s.sale_items?.length ?? 0}</TableCell>
                <TableCell className="text-right">{formatXOF(Number(s.subtotal))}</TableCell>
                <TableCell className="text-right text-xs">{formatXOF(Number(s.tax_amount))}</TableCell>
                <TableCell className="text-right font-semibold">{formatXOF(Number(s.total))}</TableCell>
                <TableCell>
                  <Badge variant={s.status === "completed" ? "default" : s.status === "cancelled" ? "destructive" : "secondary"}>
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Link to="/sales/$id" params={{ id: s.id }}>
                    <Button size="icon" variant="ghost" title="Modifier"><Pencil className="h-4 w-4" /></Button>
                  </Link>
                  <Button size="icon" variant="ghost" title="Imprimer" onClick={() => print(s)}><Printer className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" title="Dupliquer" onClick={() => duplicate(s)}><Copy className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" title="Supprimer" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
