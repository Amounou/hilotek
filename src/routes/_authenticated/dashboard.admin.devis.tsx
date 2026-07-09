import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ST = ["new","in_review","quoted","accepted","rejected","expired"];

export const Route = createFileRoute("/_authenticated/dashboard/admin/devis")({
  component: () => {
    const qc = useQueryClient();
    const { data } = useQuery({ queryKey: ["admin-quotes"], queryFn: async () => (await supabase.from("quote_requests").select("*").order("created_at",{ascending:false})).data ?? [] });
    const upd = async (id: string, status: string) => {
      const { error } = await supabase.from("quote_requests").update({ status } as never).eq("id", id);
      if (error) toast.error(error.message); else { toast.success("OK"); qc.invalidateQueries({ queryKey: ["admin-quotes"] }); }
    };
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold">Demandes de devis</h1>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Client</TableHead><TableHead>Service</TableHead><TableHead>Budget</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((q: any) => (
                <TableRow key={q.id}>
                  <TableCell className="font-mono text-xs">{q.request_number}</TableCell>
                  <TableCell>{q.name}<div className="text-xs text-muted-foreground">{q.email} · {q.phone}</div></TableCell>
                  <TableCell className="text-xs">{q.service_type}<div className="text-muted-foreground max-w-xs truncate">{q.description}</div></TableCell>
                  <TableCell className="text-xs">{q.budget}</TableCell>
                  <TableCell>
                    <Select value={q.status} onValueChange={(v)=>upd(q.id,v)}>
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
