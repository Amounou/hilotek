import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fr } from "@/lib/labels";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STAFF_ROLES, useAuth, type AppRole } from "@/lib/auth";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus } from "lucide-react";

const ROLES: AppRole[] = ["super_admin","admin","technician","cashier","commercial","warehouse","writer","support","customer"];

export const Route = createFileRoute("/_authenticated/users")({
  component: () => {
    const { hasRole } = useAuth();
    const qc = useQueryClient();
    const { data } = useQuery({
      queryKey: ["admin-users"],
      queryFn: async () => {
        const [p, ur] = await Promise.all([
          supabase.from("profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("user_roles").select("*"),
        ]);
        return (p.data ?? []).map((u: any) => ({
          ...u, roles: (ur.data ?? []).filter((r: any) => r.user_id === u.id).map((r: any) => r.role),
        }));
      },
    });
    const addRole = async (uid: string, role: AppRole) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role } as never);
      if (error) toast.error(error.message); else { toast.success("Rôle ajouté"); qc.invalidateQueries({ queryKey: ["admin-users"] }); }
    };
    const removeRole = async (uid: string, role: AppRole) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
      if (error) toast.error(error.message); else { toast.success("Rôle retiré"); qc.invalidateQueries({ queryKey: ["admin-users"] }); }
    };
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold">Utilisateurs</h1>
        {!hasRole("super_admin") && <div className="text-sm text-muted-foreground">Seul un super_admin peut modifier les rôles staff.</div>}
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôles</TableHead><TableHead>Ajouter</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell>{u.full_name ?? "-"}</TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{u.roles.map((r: AppRole) => (
                    <button key={r} onClick={() => hasRole("super_admin") && removeRole(u.id, r)} title="Retirer"><Badge variant={STAFF_ROLES.includes(r) ? "default" : "secondary"}>{fr(r)} ×</Badge></button>
                  ))}</div></TableCell>
                  <TableCell>
                    <Select onValueChange={(v) => addRole(u.id, v as AppRole)}>
                      <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Ajouter…" /></SelectTrigger>
                      <SelectContent>{ROLES.filter((r) => !u.roles.includes(r)).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
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
