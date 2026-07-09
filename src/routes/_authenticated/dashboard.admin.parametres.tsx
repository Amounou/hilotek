import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/parametres")({
  component: () => {
    const qc = useQueryClient();
    const [f, setF] = useState<any>({});
    const { data } = useQuery({ queryKey: ["settings"], queryFn: async () => (await supabase.from("settings").select("*").maybeSingle()).data });
    useEffect(() => { if (data) setF(data); }, [data]);
    const save = async () => {
      const { error } = await supabase.from("settings").update({
        company_name: f.company_name, company_email: f.company_email, company_phone: f.company_phone,
        company_address: f.company_address, tax_rate: Number(f.tax_rate ?? 18),
        currency: f.currency, whatsapp_number: f.whatsapp_number,
        social_facebook: f.social_facebook, social_instagram: f.social_instagram,
        social_linkedin: f.social_linkedin, about_fr: f.about_fr, about_en: f.about_en,
      } as never).eq("id", data!.id);
      if (error) toast.error(error.message); else { toast.success("Paramètres enregistrés"); qc.invalidateQueries({ queryKey: ["settings"] }); }
    };
    return (
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-2xl font-display font-bold">Paramètres</h1>
        <Card className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Entreprise</Label><Input value={f.company_name ?? ""} onChange={(e)=>setF({...f,company_name:e.target.value})}/></div>
            <div><Label>Email</Label><Input value={f.company_email ?? ""} onChange={(e)=>setF({...f,company_email:e.target.value})}/></div>
            <div><Label>Téléphone</Label><Input value={f.company_phone ?? ""} onChange={(e)=>setF({...f,company_phone:e.target.value})}/></div>
            <div><Label>WhatsApp</Label><Input value={f.whatsapp_number ?? ""} onChange={(e)=>setF({...f,whatsapp_number:e.target.value})}/></div>
            <div><Label>Adresse</Label><Input value={f.company_address ?? ""} onChange={(e)=>setF({...f,company_address:e.target.value})}/></div>
            <div><Label>TVA (%)</Label><Input type="number" step="0.01" value={f.tax_rate ?? 18} onChange={(e)=>setF({...f,tax_rate:e.target.value})}/></div>
            <div><Label>Devise</Label><Input value={f.currency ?? "XOF"} onChange={(e)=>setF({...f,currency:e.target.value})}/></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Facebook</Label><Input value={f.social_facebook ?? ""} onChange={(e)=>setF({...f,social_facebook:e.target.value})}/></div>
            <div><Label>Instagram</Label><Input value={f.social_instagram ?? ""} onChange={(e)=>setF({...f,social_instagram:e.target.value})}/></div>
            <div><Label>LinkedIn</Label><Input value={f.social_linkedin ?? ""} onChange={(e)=>setF({...f,social_linkedin:e.target.value})}/></div>
          </div>
          <div><Label>À propos FR</Label><Textarea rows={3} value={f.about_fr ?? ""} onChange={(e)=>setF({...f,about_fr:e.target.value})}/></div>
          <div><Label>À propos EN</Label><Textarea rows={3} value={f.about_en ?? ""} onChange={(e)=>setF({...f,about_en:e.target.value})}/></div>
          <Button onClick={save} className="gradient-brand text-brand-foreground border-0">Enregistrer</Button>
        </Card>
      </div>
    );
  },
});
