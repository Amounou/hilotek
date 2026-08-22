import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 group", className)}>
      <img
        src="/hilotek-logo.png"
        alt="HiloTek — Pensé pour innover, Créé pour impacter"
        className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
      />
      {showText && (
        <span className="hidden sm:inline font-display font-semibold text-lg tracking-tight">
          <span className="text-primary">HiloTek</span>
          <span className="ml-1 text-muted-foreground text-xs uppercase tracking-widest">
            Services &amp; Tech
          </span>
        </span>
      )}
    </Link>
  );
}
