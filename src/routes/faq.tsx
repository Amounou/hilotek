import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  { q: "Quels moyens de paiement acceptez-vous ?", a: "Orange Money, MTN Money, Wave, carte bancaire, espèces et virement." },
  { q: "Combien de temps prend une réparation ?", a: "Entre 24h et 5 jours selon la panne et la disponibilité des pièces. Vous êtes tenus informés à chaque étape." },
  { q: "Comment suivre ma commande ?", a: "Utilisez la page Suivi avec votre numéro de dossier ou votre jeton reçu par email." },
  { q: "La livraison est-elle disponible partout ?", a: "Oui, à Ouagadougou et en province via nos partenaires logistiques." },
  { q: "Vos produits sont-ils garantis ?", a: "Tous nos produits bénéficient d'une garantie constructeur." },
  { q: "Puis-je payer un mémoire en plusieurs fois ?", a: "Oui, un acompte est requis puis vous soldez à la livraison." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — HiloTek" }] }),
  component: () => (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-center mb-10">Questions fréquentes</h1>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`i${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </PublicShell>
  ),
});
