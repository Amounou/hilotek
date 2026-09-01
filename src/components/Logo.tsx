import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/lib/settings";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  const s = useSiteSettings();
  const name = s?.company_name || "HiloTek Services & Tech";
  const [main, ...rest] = name.split(" ");
  return (
    <Link to="/" className={cn("flex items-center gap-2 group", className)}>
      <img
        src={s?.logo_url || "/hilotek-logo.png"}
        alt={name}
        className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
      />
      {showText && (
        <span className="hidden sm:inline font-display font-semibold text-lg tracking-tight">
          <span className="text-primary">{main}</span>
          {rest.length > 0 && (
            <span className="ml-1 text-muted-foreground text-xs uppercase tracking-widest">
              {rest.join(" ")}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
