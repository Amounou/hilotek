import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useSiteSettings } from "@/lib/settings";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — HiloTek" }, { name: "description", content: "Contactez notre équipe." }] }),
  component: () => {
    const { t } = useI18n();
    const s = useSiteSettings();
    const [f, setF] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

    const [loading, setLoading] = useState(false);
    const submit = async (e: React.FormEvent) => {
      e.preventDefault(); setLoading(true);
      const { error } = await supabase.from("contact_messages").insert(f);
      setLoading(false);
      if (error) toast.error(error.message);
      else { toast.success(t("contact.ok")); setF({ name: "", email: "", phone: "", subject: "", message: "" }); }
    };
    return (
      <PublicShell>
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-display font-bold">{t("contact.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("contact.subtitle")}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <Card className="p-4 flex items-center gap-3"><Phone className="h-5 w-5 text-brand" /><div><div className="text-xs text-muted-foreground">Téléphone</div><div className="font-medium">{s?.phone ?? "—"}</div></div></Card>
              <Card className="p-4 flex items-center gap-3"><Mail className="h-5 w-5 text-brand" /><div><div className="text-xs text-muted-foreground">Email</div><div className="font-medium">{s?.email ?? "—"}</div></div></Card>
              <Card className="p-4 flex items-center gap-3"><MapPin className="h-5 w-5 text-brand" /><div><div className="text-xs text-muted-foreground">Adresse</div><div className="font-medium">{s?.address ?? "—"}</div></div></Card>
              {s?.hours && <Card className="p-4 flex items-center gap-3"><Clock className="h-5 w-5 text-brand" /><div><div className="text-xs text-muted-foreground">Horaires</div><div className="font-medium">{s.hours}</div></div></Card>}

            </div>
            <Card className="p-6 md:col-span-2">
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <div><Label>{t("c.name")}</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
                <div><Label>{t("c.email")}</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
                <div><Label>{t("c.phone")}</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
                <div><Label>{t("contact.subject")}</Label><Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>{t("contact.message")}</Label><Textarea required rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
                <div className="sm:col-span-2"><Button type="submit" disabled={loading} className="gradient-brand text-brand-foreground border-0">{t("contact.send")}</Button></div>
              </form>
            </Card>
          </div>
        </div>
      </PublicShell>
    );
  },
});
