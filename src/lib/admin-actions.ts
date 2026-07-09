import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function updateStatus(table: string, id: string, status: string) {
  const { error } = await (supabase.from(table as any).update({ status } as never).eq("id", id) as any);
  if (error) toast.error(error.message);
  else toast.success("Statut mis à jour");
}
