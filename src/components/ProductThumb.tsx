import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: number;
};

/** Vignette produit réutilisable (listes, factures, commandes, ventes…) */
export function ProductThumb({ src, alt = "", className, size = 40 }: Props) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-md border border-border/60 bg-muted/40 overflow-hidden grid place-items-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}
