import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages")({
  component: () => {
    const qc = useQueryClient();
    const { data } = useQuery({ queryKey: ["msgs"], queryFn: async () => (await supabase.from("contact_messages").select("*").order("created_at", { ascending: false })).data ?? [] });
    const mark = async (id: string, is_read: boolean) => {
      const { error } = await supabase.from("contact_messages").update({ is_read } as never).eq("id", id);
      if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["msgs"] });
    };
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold">Messages</h1>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead></TableHead><TableHead>De</TableHead><TableHead>Sujet</TableHead><TableHead>Message</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((m: any) => (
                <TableRow key={m.id} className={m.is_read ? "opacity-60" : ""}>
                  <TableCell>{m.is_read ? <Badge variant="secondary">Lu</Badge> : <Button size="icon" variant="ghost" onClick={() => mark(m.id, true)}><Check className="h-4 w-4" /></Button>}</TableCell>
                  <TableCell>{m.name}<div className="text-xs text-muted-foreground">{m.email}</div></TableCell>
                  <TableCell>{m.subject}</TableCell>
                  <TableCell className="max-w-md text-sm">{m.message}</TableCell>
                  <TableCell className="text-xs">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  },
});
