import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fr } from "@/lib/labels";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatXOF } from "@/lib/i18n";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invoices")({
  component: () => {
    const { data } = useQuery({ queryKey: ["admin-inv"], queryFn: async () => (await supabase.from("invoices").select("*").order("created_at",{ascending:false})).data ?? [] });
    const download = async (inv: any) => {
      const doc = new jsPDF();
      doc.setFontSize(20); doc.text("@lkof Services & Tech", 14, 20);
      doc.setFontSize(11); doc.text(`${inv.type.toUpperCase()} N° ${inv.invoice_number}`, 14, 30);
      doc.text(`Date : ${new Date(inv.created_at).toLocaleDateString()}`, 14, 36);
      doc.text(`Client : ${inv.client_name}`, 14, 46);
      if (inv.client_email) doc.text(inv.client_email, 14, 52);
      if (inv.client_phone) doc.text(inv.client_phone, 14, 58);
      let y = 76; doc.setFontSize(10);
      doc.text("Article", 14, y); doc.text("Qté", 120, y); doc.text("PU", 140, y); doc.text("Total", 170, y); y += 4;
      doc.line(14, y, 196, y); y += 6;
      (inv.items ?? []).forEach((it: any) => {
        doc.text(String(it.name).slice(0, 60), 14, y);
        doc.text(String(it.quantity ?? 1), 120, y);
        doc.text(String(it.unit_price ?? 0), 140, y);
        doc.text(String(it.total ?? 0), 170, y); y += 6;
      });
      y += 4; doc.line(14, y, 196, y); y += 8;
      doc.text(`Sous-total: ${formatXOF(Number(inv.subtotal))}`, 130, y); y += 6;
      doc.text(`TVA: ${formatXOF(Number(inv.tax))}`, 130, y); y += 6;
      doc.setFontSize(12); doc.text(`TOTAL: ${formatXOF(Number(inv.total))}`, 130, y);
      if (inv.qr_data) {
        const qr = await QRCode.toDataURL(inv.qr_data);
        doc.addImage(qr, "PNG", 14, y - 12, 30, 30);
      }
      doc.save(`${inv.invoice_number}.pdf`);
    };
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold">Factures</h1>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Type</TableHead><TableHead>Client</TableHead><TableHead>Total</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((i: any) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                  <TableCell><Badge variant="outline">{fr(i.type)}</Badge></TableCell>
                  <TableCell>{i.client_name}</TableCell>
                  <TableCell className="font-semibold">{formatXOF(Number(i.total))}</TableCell>
                  <TableCell><Badge>{fr(i.status ?? "issued")}</Badge></TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => download(i)}><Download className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  },
});
