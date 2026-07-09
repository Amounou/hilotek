import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/rendez-vous")({
  head: () => ({ meta: [{ title: "Prendre rendez-vous — @lkof" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ service: typeof s.service === "string" ? s.service : "" }),
  component: RDV,
});

function RDV() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { service } = Route.useSearch();
  const [f, setF] = useState({ service_id: "", client_name: "", client_email: user?.email ?? "", client_phone: "", preferred_date: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const { data: services } = useQuery({
    queryKey: ["services-select"],
    queryFn: async () => (await supabase.from("services").select("id,slug,name_fr,name_en").eq("is_active", true).order("sort_order")).data ?? [],
  });
  useEffect(() => {
    if (service && services) {
      const s = services.find((x: any) => x.slug === service);
      if (s) setF((p) => ({ ...p, service_id: s.id }));
    }
  }, [service, services]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const svc = services?.find((x: any) => x.id === f.service_id);
    const { data, error } = await supabase.from("service_bookings").insert({
      booking_number: "",
      service_id: f.service_id || null,
      service_name: svc ? (lang === "fr" ? svc.name_fr : svc.name_en) : null,
      client_name: f.client_name,
      client_email: f.client_email || null,
      client_phone: f.client_phone,
      preferred_date: f.preferred_date || null,
      notes: f.notes || null,
      user_id: user?.id ?? null,
    } as never).select().single();
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success(`${t("book.ok")} : ${data?.booking_number ?? ""}`);
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-center mb-8">{t("book.title")}</h1>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div><Label>{t("book.service")}</Label>
              <Select value={f.service_id} onValueChange={(v) => setF({ ...f, service_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>{(services ?? []).map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{lang === "fr" ? s.name_fr : s.name_en}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{t("c.name")}</Label><Input required value={f.client_name} onChange={(e) => setF({ ...f, client_name: e.target.value })}/></div>
              <div><Label>{t("c.phone")}</Label><Input required value={f.client_phone} onChange={(e) => setF({ ...f, client_phone: e.target.value })}/></div>
              <div><Label>{t("c.email")}</Label><Input type="email" value={f.client_email} onChange={(e) => setF({ ...f, client_email: e.target.value })}/></div>
              <div><Label>{t("book.date")}</Label><Input type="datetime-local" value={f.preferred_date} onChange={(e) => setF({ ...f, preferred_date: e.target.value })}/></div>
            </div>
            <div><Label>Notes</Label><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })}/></div>
            <Button type="submit" disabled={loading} className="w-full gradient-brand text-brand-foreground border-0">{t("srv.book")}</Button>
          </form>
        </Card>
      </div>
    </PublicShell>
  );
}
