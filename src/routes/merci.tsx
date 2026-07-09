import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/merci")({
  validateSearch: (s: Record<string, unknown>) => ({ order: typeof s.order === "string" ? s.order : "" }),
  component: () => {
    const { order } = Route.useSearch();
    return (
      <PublicShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto text-brand mb-4" />
          <h1 className="text-3xl font-display font-bold">Merci pour votre commande !</h1>
          <p className="mt-3 text-muted-foreground">
            Votre commande <span className="font-mono font-semibold">{order}</span> a bien été enregistrée. Nous vous contacterons rapidement pour la confirmation du paiement et la livraison.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/boutique"><Button variant="outline">Continuer les achats</Button></Link>
            <Link to="/"><Button className="gradient-brand text-brand-foreground border-0">Accueil</Button></Link>
          </div>
        </div>
      </PublicShell>
    );
  },
});
