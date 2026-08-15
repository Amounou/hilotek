import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Printer, Copy, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { formatXOF } from "@/lib/i18n";
import { fr } from "@/lib/labels";
import { generateSalePdf, type PdfFormat } from "@/lib/sales-pdf";

export const Route = createFileRoute("/_authenticated/quotes/list")({
  component: ProformaList,
});

function ProformaList() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const db = supabase as any;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["proformas-list"],
    queryFn: async () => {
      const { data, error } = await db
        .from("proformas")
        .select("*, proforma_items(id, product_name, quantity, unit_price, line_total, product_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return (data ?? []).filter((s: any) => {
      if (status !== "all" && s.status !== status) return false;
      if (from && new Date(s.proforma_date) < new Date(from)) return false;
      if (to && new Date(s.proforma_date) > new Date(to + "T23:59:59")) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (
          !String(s.proforma_number).toLowerCase().includes(needle) &&
          !String(s.client_name).toLowerCase().includes(needle)
        ) return false;
      }
      return true;
    });
  }, [data, q, status, from, to]);

  const totals = useMemo(() => filtered.reduce(
    (acc: any, s: any) => { acc.count++; acc.ht += Number(s.subtotal); acc.ttc += Number(s.total); return acc; },
    { count: 0, ht: 0, ttc: 0 },
  ), [filtered]);

  const del = async (id: string) => {
    if (!confirm("Supprimer définitivement ce devis ?")) return;
    const { error } = await db.from("proformas").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Devis supprimé"); qc.invalidateQueries({ queryKey: ["proformas-list"] }); }
  };

  const buildPdf = async (s: any, mode: "save" | "print", format: PdfFormat = "a4") => {
    const { data: settings } = await supabase.rpc("get_public_settings");
    const c: any = settings ?? {};
    await generateSalePdf(
      {
        invoice_number: s.proforma_number,
        sale_date: s.proforma_date,
        client_name: s.client_name,
        client_email: s.client_email,
        client_phone: s.client_phone,
        seller_name: s.seller_name,
        subtotal: Number(s.subtotal),
        tax_rate: Number(s.tax_rate),
        tax_amount: Number(s.tax_amount),
        total: Number(s.total),
        notes: s.notes,
        doc_label: "FACTURE PRO-FORMA",
        items: (s.proforma_items ?? []).map((i: any) => ({
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
      format,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold">Devis</h1>
          <p className="text-sm text-muted-foreground">{totals.count} devis — HT {formatXOF(totals.ht)} · TTC {formatXOF(totals.ttc)}</p>
        </div>
        <Link to="/quotes/new" search={{ from: undefined }}>
          <Button className="gradient-brand text-brand-foreground border-0">
            <Plus className="h-4 w-4 mr-1" />Faire Un Devis
          </Button>
        </Link>
      </div>

      <Card className="p-3 grid gap-2 md:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="N° pro-forma, client…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="sent">Envoyé</SelectItem>
            <SelectItem value="accepted">Accepté</SelectItem>
            <SelectItem value="rejected">Refusé</SelectItem>
            <SelectItem value="expired">Expiré</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Pro-forma</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Éléments</TableHead>
              <TableHead className="text-right">HT</TableHead>
              <TableHead className="text-right">TVA</TableHead>
              <TableHead className="text-right">TTC</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (<TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Chargement…</TableCell></TableRow>)}
            {!isLoading && filtered.length === 0 && (<TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Aucun devis</TableCell></TableRow>)}
            {filtered.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.proforma_number}</TableCell>
                <TableCell className="text-sm">{new Date(s.proforma_date).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell className="text-sm">{s.client_name}</TableCell>
                <TableCell className="text-right">{s.proforma_items?.length ?? 0}</TableCell>
                <TableCell className="text-right">{formatXOF(Number(s.subtotal))}</TableCell>
                <TableCell className="text-right text-xs">{formatXOF(Number(s.tax_amount))}</TableCell>
                <TableCell className="text-right font-semibold">{formatXOF(Number(s.total))}</TableCell>
                <TableCell>
                  <Badge variant={s.status === "accepted" ? "default" : s.status === "rejected" ? "destructive" : "secondary"}>
                    {fr(s.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Link to="/quotes/$id" params={{ id: s.id }}>
                    <Button size="icon" variant="ghost" title="Modifier"><Pencil className="h-4 w-4" /></Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" title="Télécharger"><Download className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => buildPdf(s, "save", "a4")}>Télécharger A4</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => buildPdf(s, "save", "a5")}>Télécharger A5</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" title="Imprimer"><Printer className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => buildPdf(s, "print", "a4")}>Imprimer A4</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => buildPdf(s, "print", "a5")}>Imprimer A5</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="icon" variant="ghost" title="Dupliquer" onClick={() => nav({ to: "/quotes/new", search: { from: s.id } })}><Copy className="h-4 w-4" /></Button>
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
