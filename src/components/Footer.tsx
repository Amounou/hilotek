import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useI18n } from "@/lib/i18n";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiteSettings } from "@/lib/settings";

export function Footer() {
  const { t } = useI18n();
  const s = useSiteSettings();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);


  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    setLoading(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error(t("c.error"));
    } else {
      toast.success(t("home.newsletter.ok"));
      setEmail("");
    }
  };

  return (
    <footer className="border-t bg-card mt-20">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              {t("home.hero.subtitle")}
            </p>
            <div className="mt-4 flex gap-2">
              <a href="#" className="p-2 rounded-md hover:bg-accent"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="p-2 rounded-md hover:bg-accent"><Instagram className="h-4 w-4" /></a>
              <a href="#" className="p-2 rounded-md hover:bg-accent"><Linkedin className="h-4 w-4" /></a>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-3 text-sm">{t("footer.company")}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">{t("nav.about")}</Link></li>
              <li><Link to="/services" className="hover:text-foreground">{t("nav.services")}</Link></li>
              <li><Link to="/boutique" className="hover:text-foreground">{t("nav.shop")}</Link></li>
              <li><Link to="/blog" className="hover:text-foreground">{t("nav.blog")}</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3 text-sm">{t("footer.support")}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/contact" className="hover:text-foreground">{t("nav.contact")}</Link></li>
              <li><Link to="/devis" className="hover:text-foreground">{t("nav.quote")}</Link></li>
              <li><Link to="/rendez-vous" className="hover:text-foreground">{t("nav.booking")}</Link></li>
              <li><Link to="/suivi-reparation" className="hover:text-foreground">{t("nav.track_repair")}</Link></li>
              <li><Link to="/suivi-memoire" className="hover:text-foreground">{t("nav.track_memoire")}</Link></li>
              <li><Link to="/faq" className="hover:text-foreground">{t("nav.faq")}</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3 text-sm">{t("home.newsletter.title")}</div>
            <p className="text-sm text-muted-foreground mb-3">{t("home.newsletter.subtitle")}</p>
            <form onSubmit={subscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder={t("home.newsletter.placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading} size="sm" className="gradient-brand text-brand-foreground border-0">
                {t("home.newsletter.cta")}
              </Button>
            </form>
            <div className="mt-5 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> +226 00 00 00 00</div>
              <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> contact@alkof.tech</div>
              <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Ouagadougou, Burkina Faso</div>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} @lkof Services &amp; Tech. {t("footer.rights")}</div>
          <div className="flex gap-4">
            <Link to="/conditions" className="hover:text-foreground">{t("footer.terms")}</Link>
            <Link to="/confidentialite" className="hover:text-foreground">{t("footer.privacy")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
