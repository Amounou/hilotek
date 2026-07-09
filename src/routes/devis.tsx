import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

const SERVICES = ["Développement Web","Développement Mobile","Cybersécurité","Cloud","IA","Maintenance","Installation Réseau","Autre"];
const BUDGETS = ["< 100 000 FCFA","100 000 - 500 000","500 000 - 2M","> 2M"];

export const Route = createFileRoute("/devis")({
  head: () => ({ meta: [{ title: "Demande de devis — @lkof" }] }),
  component: () => {
    const { t } = useI18n();
    const [f, setF] = useState({ name:"",email:"",phone:"",company:"",service_type: SERVICES[0], budget: BUDGETS[0], description:""});
    const [loading, setLoading] = useState(false);
    const submit = async (e: React.FormEvent) => {
      e.preventDefault(); setLoading(true);
      const { data, error } = await supabase.from("quote_requests").insert({ request_number: "", ...f } as never).select().single();
      setLoading(false);
      if (error) toast.error(error.message);
      else { toast.success(`${t("q.ok")} ${data?.request_number ?? ""}`); setF({ name:"",email:"",phone:"",company:"",service_type: SERVICES[0], budget: BUDGETS[0], description:""}); }
    };
    return (
      <PublicShell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-center">{t("q.title")}</h1>
          <p className="text-center text-muted-foreground mt-2 mb-8">{t("q.subtitle")}</p>
          <Card className="p-6">
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <div><Label>{t("c.name")}</Label><Input required value={f.name} onChange={(e)=>setF({...f, name:e.target.value})}/></div>
              <div><Label>{t("q.company")}</Label><Input value={f.company} onChange={(e)=>setF({...f, company:e.target.value})}/></div>
              <div><Label>{t("c.email")}</Label><Input type="email" required value={f.email} onChange={(e)=>setF({...f, email:e.target.value})}/></div>
              <div><Label>{t("c.phone")}</Label><Input value={f.phone} onChange={(e)=>setF({...f, phone:e.target.value})}/></div>
              <div>
                <Label>{t("q.service")}</Label>
                <Select value={f.service_type} onValueChange={(v)=>setF({...f, service_type:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{SERVICES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("q.budget")}</Label>
                <Select value={f.budget} onValueChange={(v)=>setF({...f, budget:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{BUDGETS.map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label>{t("q.desc")}</Label><Textarea required rows={5} value={f.description} onChange={(e)=>setF({...f, description:e.target.value})}/></div>
              <div className="sm:col-span-2"><Button type="submit" disabled={loading} className="gradient-brand text-brand-foreground border-0">{t("contact.send")}</Button></div>
            </form>
          </Card>
        </div>
      </PublicShell>
    );
  },
});
