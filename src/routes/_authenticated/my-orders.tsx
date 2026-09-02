import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fr } from "@/lib/labels";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { formatXOF } from "@/lib/i18n";
import { ProductThumb } from "@/components/ProductThumb";

export const Route = createFileRoute("/_authenticated/my-orders")({
  component: () => {
    const { user } = useAuth();
    const { data } = useQuery({
      queryKey: ["me-orders", user?.id],
      enabled: !!user,
      queryFn: async () => (await supabase.from("orders").select("*").eq("user_id", user!.id).order("created_at",{ascending:false})).data ?? [],
    });
    const { data: itemsByOrder } = useQuery({
      queryKey: ["me-order-items", user?.id],
      enabled: !!user,
      queryFn: async () => {
        const { data } = await supabase
          .from("order_items")
          .select("order_id, product_name, products(images), orders!inner(user_id)")
          .eq("orders.user_id", user!.id);
        const map: Record<string, any[]> = {};
        (data ?? []).forEach((it: any) => { (map[it.order_id] ||= []).push(it); });
        return map;
      },
    });
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold">Mes commandes</h1>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Articles</TableHead><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Paiement</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.order_number}</TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {((itemsByOrder ?? {})[o.id] ?? []).slice(0, 4).map((it: any, k: number) => (
                        <ProductThumb key={k} src={it.products?.images?.[0]} alt={it.product_name} size={32} className="ring-2 ring-background" />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-semibold">{formatXOF(Number(o.total))}</TableCell>
                  <TableCell><Badge variant="outline">{fr(o.payment_status)}</Badge></TableCell>
                  <TableCell><Badge>{fr(o.status)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  },
});
