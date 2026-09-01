import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PublicSettings = {
  company_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
  socials: Record<string, string> | null;
  currency: string | null;
  logo_url: string | null;
  tax_rate: number | null;
};

export function useTaxRate() {
  const s = useSiteSettings();
  return Number(s?.tax_rate ?? 18);
}

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ["public-settings"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_settings");
      if (error) throw error;
      return (data ?? null) as unknown as PublicSettings | null;
    },
  });
  return data ?? null;
}
