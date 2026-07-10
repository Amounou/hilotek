import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth, STAFF_ROLES } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { Menu, ShoppingCart, Sun, Moon, User, LogOut, LayoutDashboard, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const links = [
  { to: "/", key: "nav.home" },
  { to: "/services", key: "nav.services" },
  { to: "/boutique", key: "nav.shop" },
  { to: "/blog", key: "nav.blog" },
  { to: "/about", key: "nav.about" },
  { to: "/contact", key: "nav.contact" },
] as const;

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { isAuthenticated, hasAny, signOut, user } = useAuth();
  const { count } = useCart();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const staff = hasAny(STAFF_ROLES);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Logo />
        <nav className="hidden lg:flex items-center gap-1 ml-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === l.to
                  ? "text-brand"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent"
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            title="Language"
          >
            <Globe className="h-4 w-4 mr-1" />
            <span className="uppercase text-xs">{lang}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggle} title="Theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link to="/panier">
            <Button variant="ghost" size="icon" className="relative" title={t("nav.cart")}>
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand text-brand-foreground text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center font-semibold">
                  {count}
                </span>
              )}
            </Button>
          </Link>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user?.email}</div>
                <DropdownMenuSeparator />
                {staff && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-2" />{t("nav.dashboard")}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/my-orders"><User className="h-4 w-4 mr-2" />Mes commandes</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />{t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="hidden md:block">
              <Button size="sm" variant="default" className="gradient-brand text-brand-foreground border-0 hover:opacity-90">
                {t("nav.login")}
              </Button>
            </Link>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-1 mt-8">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent"
                  >
                    {t(l.key)}
                  </Link>
                ))}
                <div className="my-2 border-t" />
                <Link to="/devis" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md text-sm hover:bg-accent">{t("nav.quote")}</Link>
                <Link to="/rendez-vous" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md text-sm hover:bg-accent">{t("nav.booking")}</Link>
                <Link to="/suivi-reparation" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md text-sm hover:bg-accent">{t("nav.track_repair")}</Link>
                <Link to="/suivi-memoire" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md text-sm hover:bg-accent">{t("nav.track_memoire")}</Link>
                {!isAuthenticated && (
                  <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md text-sm hover:bg-accent">{t("nav.login")}</Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
