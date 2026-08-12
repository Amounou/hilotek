import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const [f, setF] = useState<any>({});
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await supabase.from("settings").select("*").eq("id", 1).maybeSingle()).data,
  });
  useEffect(() => {
    if (data) setF({ ...data, socials: (data as any).socials ?? {} });
  }, [data]);

  const setS = (k: string, v: string) => setF({ ...f, socials: { ...(f.socials ?? {}), [k]: v } });

  const save = async () => {
    const { error } = await supabase
      .from("settings")
      .update({
        company_name: f.company_name,
        email: f.email,
        phone: f.phone,
        address: f.address,
        hours: f.hours,
        currency: f.currency || "XOF",
        tax_rate: Number(f.tax_rate ?? 18),
        logo_url: f.logo_url || null,
        socials: f.socials ?? {},
      } as never)
      .eq("id", 1);
    if (error) toast.error(error.message);
    else {
      toast.success("Paramètres enregistrés");
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["public-settings"] });
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-display font-bold">Paramètres</h1>
      <Card className="p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Entreprise</Label><Input value={f.company_name ?? ""} onChange={(e) => setF({ ...f, company_name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={f.email ?? ""} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label>Téléphone</Label><Input value={f.phone ?? ""} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div><Label>Adresse</Label><Input value={f.address ?? ""} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
          <div><Label>Horaires</Label><Input value={f.hours ?? ""} onChange={(e) => setF({ ...f, hours: e.target.value })} /></div>
          <div><Label>Logo (URL)</Label><Input value={f.logo_url ?? ""} onChange={(e) => setF({ ...f, logo_url: e.target.value })} /></div>
          <div><Label>TVA (%)</Label><Input type="number" step="0.01" value={f.tax_rate ?? 18} onChange={(e) => setF({ ...f, tax_rate: e.target.value })} /></div>
          <div><Label>Devise</Label><Input value={f.currency ?? "XOF"} onChange={(e) => setF({ ...f, currency: e.target.value })} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><Label>Facebook</Label><Input value={f.socials?.facebook ?? ""} onChange={(e) => setS("facebook", e.target.value)} /></div>
          <div><Label>Instagram</Label><Input value={f.socials?.instagram ?? ""} onChange={(e) => setS("instagram", e.target.value)} /></div>
          <div><Label>LinkedIn</Label><Input value={f.socials?.linkedin ?? ""} onChange={(e) => setS("linkedin", e.target.value)} /></div>
          <div><Label>WhatsApp</Label><Input value={f.socials?.whatsapp ?? ""} onChange={(e) => setS("whatsapp", e.target.value)} /></div>
        </div>
        <Button onClick={save} className="gradient-brand text-brand-foreground border-0">Enregistrer</Button>
      </Card>
    </div>
  );
}
