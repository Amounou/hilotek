import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "signup" ? "signup" : "login",
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  head: () => ({ meta: [{ title: "Connexion — HiloTek" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, redirect } = Route.useSearch();
  const nav = useNavigate();
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) nav({ to: redirect as any });
  }, [isAuthenticated, redirect, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      setLoading(false);
      if (error) toast.error(error.message);
      else { toast.success("Compte créé !"); nav({ to: redirect as any }); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) toast.error(error.message);
      else nav({ to: redirect as any });
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Erreur Google");
  };

  const resetPwd = async () => {
    if (!email) return toast.error("Entrez votre email");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success(t("auth.reset_sent"));
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="text-center mb-8"><Logo /></div>
        <Card className="p-8">
          <h1 className="text-2xl font-display font-bold text-center mb-1">
            {mode === "signup" ? t("auth.signup") : t("auth.login")}
          </h1>
          <p className="text-center text-sm text-muted-foreground mb-6">HiloTek Services &amp; Tech</p>
          <Button type="button" variant="outline" className="w-full" onClick={google}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            {t("auth.google")}
          </Button>
          <div className="my-4 flex items-center gap-2"><div className="flex-1 border-t" /><span className="text-xs text-muted-foreground">{t("auth.or")}</span><div className="flex-1 border-t" /></div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div><Label>{t("auth.name")}</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            )}
            <div><Label>{t("auth.email")}</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>{t("auth.password")}</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button type="submit" disabled={loading} className="w-full gradient-brand text-brand-foreground border-0">
              {mode === "signup" ? t("auth.signup") : t("auth.login")}
            </Button>
          </form>
          {mode === "login" && (
            <div className="mt-3 text-center">
              <button type="button" onClick={resetPwd} className="text-xs text-muted-foreground hover:text-foreground">{t("auth.forgot")}</button>
            </div>
          )}
          <div className="mt-6 text-center text-sm">
            {mode === "signup" ? t("auth.have") : t("auth.no")}{" "}
            <button
              type="button"
              className="text-brand font-medium"
              onClick={() => nav({ to: "/auth", search: { mode: mode === "signup" ? "login" : "signup", redirect } })}
            >
              {mode === "signup" ? t("auth.login") : t("auth.signup")}
            </button>
          </div>
        </Card>
      </div>
    </PublicShell>
  );
}
