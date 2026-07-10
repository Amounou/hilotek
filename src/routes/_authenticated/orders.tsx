import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatXOF } from "@/lib/i18n";
import { toast } from "sonner";

const STATUSES = ["pending","confirmed","processing","shipped","delivered","completed","cancelled","refunded"];
const PAY = ["pending","paid","failed","refunded"];

export const Route = createFileRoute("/_authenticated/orders")({
  component: () => {
    const qc = useQueryClient();
    const { data } = useQuery({
      queryKey: ["admin-orders"],
      queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false })).data ?? [],
    });
    const upd = async (id: string, patch: any) => {
      const { error } = await supabase.from("orders").update(patch as never).eq("id", id);
      if (error) toast.error(error.message); else { toast.success("OK"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
    };
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold">Commandes</h1>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Client</TableHead><TableHead>Total</TableHead><TableHead>Paiement</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.order_number}</TableCell>
                  <TableCell><div>{o.customer_name}</div><div className="text-xs text-muted-foreground">{o.customer_email}</div></TableCell>
                  <TableCell className="font-semibold">{formatXOF(Number(o.total))}</TableCell>
                  <TableCell>
                    <Select value={o.payment_status} onValueChange={(v) => upd(o.id, { payment_status: v })}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>{PAY.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={(v) => upd(o.id, { status: v })}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  },
});
