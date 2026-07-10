import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ST = ["pending","confirmed","completed","cancelled"];

export const Route = createFileRoute("/_authenticated/dashboard/admin/rendez-vous")({
  component: () => {
    const qc = useQueryClient();
    const { data } = useQuery({ queryKey: ["admin-book"], queryFn: async () => (await supabase.from("service_bookings").select("*").order("created_at",{ascending:false})).data ?? [] });
    const upd = async (id: string, status: string) => {
      const { error } = await supabase.from("service_bookings").update({ status } as never).eq("id", id);
      if (error) toast.error(error.message); else { toast.success("OK"); qc.invalidateQueries({ queryKey: ["admin-book"] }); }
    };
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold">Rendez-vous</h1>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Client</TableHead><TableHead>Service</TableHead><TableHead>Date souhaitée</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.booking_number}</TableCell>
                  <TableCell>{b.client_name}<div className="text-xs text-muted-foreground">{b.client_phone}</div></TableCell>
                  <TableCell className="text-xs">{b.service_name}</TableCell>
                  <TableCell className="text-xs">{b.preferred_date ? new Date(b.preferred_date).toLocaleString() : "-"}</TableCell>
                  <TableCell>
                    <Select value={b.status} onValueChange={(v)=>upd(b.id,v)}>
                      <SelectTrigger className="h-8 w-32"><SelectValue/></SelectTrigger>
                      <SelectContent>{ST.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
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
