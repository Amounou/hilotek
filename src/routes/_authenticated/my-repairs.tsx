import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fr } from "@/lib/labels";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/my-repairs")({
  component: () => {
    const { user } = useAuth();
    const { data } = useQuery({
      queryKey: ["me-reps", user?.email],
      enabled: !!user?.email,
      queryFn: async () => (await supabase.from("repairs").select("*").eq("client_email", user!.email!).order("created_at",{ascending:false})).data ?? [],
    });
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-display font-bold">Mes réparations</h1>
          <Link to="/suivi-reparation"><Button variant="outline">Suivi par jeton</Button></Link>
        </div>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Appareil</TableHead><TableHead>Statut</TableHead><TableHead>Jeton</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.repair_number}</TableCell>
                  <TableCell className="text-xs">{r.device_type} {r.brand} {r.model}</TableCell>
                  <TableCell><Badge>{fr(r.status)}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{r.tracking_token}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  },
});
