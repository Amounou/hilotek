import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  component: () => {
    const [pwd, setPwd] = useState("");
    const [loading, setLoading] = useState(false);
    const { t } = useI18n();
    const nav = useNavigate();
    const submit = async (e: React.FormEvent) => {
      e.preventDefault(); setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: pwd });
      setLoading(false);
      if (error) toast.error(error.message);
      else { toast.success("Mot de passe mis à jour"); nav({ to: "/" }); }
    };
    return (
      <PublicShell>
        <div className="mx-auto max-w-md px-4 py-16">
          <Card className="p-8">
            <h1 className="text-2xl font-display font-bold mb-6">{t("auth.reset_password")}</h1>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>{t("auth.password")}</Label><Input type="password" required minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} /></div>
              <Button type="submit" disabled={loading} className="w-full gradient-brand text-brand-foreground border-0">{t("auth.update_password")}</Button>
            </form>
          </Card>
        </div>
      </PublicShell>
    );
  },
});
