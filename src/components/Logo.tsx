import logoAsset from "@/assets/alkof-logo.png.asset.json";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 group", className)}>
      <img
        src={logoAsset.url}
        alt="@lkof Services & Tech"
        className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
      />
      {showText && (
        <span className="hidden sm:inline font-display font-semibold text-lg tracking-tight">
          <span className="text-primary">@lkof</span>
          <span className="ml-1 text-muted-foreground text-xs uppercase tracking-widest">
            Services &amp; Tech
          </span>
        </span>
      )}
    </Link>
  );
}
