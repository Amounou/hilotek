import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";
import { formatXOF } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/my-memoires")({
  component: () => {
    const { user } = useAuth();
    const { data } = useQuery({
      queryKey: ["me-mem", user?.email],
      enabled: !!user?.email,
      queryFn: async () => (await supabase.from("memoires").select("*").eq("client_email", user!.email!).order("created_at",{ascending:false})).data ?? [],
    });
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold">Mes mémoires</h1>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Thème</TableHead><TableHead>Progression</TableHead><TableHead>Solde</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.memoire_number}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs">{m.theme}</TableCell>
                  <TableCell className="w-40"><Progress value={m.progress ?? 0} /><div className="text-xs mt-1">{m.progress ?? 0}%</div></TableCell>
                  <TableCell className="text-xs">{formatXOF(Number(m.balance))}</TableCell>
                  <TableCell><Badge>{m.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  },
});
