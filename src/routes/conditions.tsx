import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";

export const Route = createFileRoute("/conditions")({
  head: () => ({ meta: [{ title: "Conditions — HiloTek" }] }),
  component: () => (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-16 prose prose-neutral dark:prose-invert">
        <h1>Conditions d'utilisation</h1>
        <p>Bienvenue sur HiloTek Services &amp; Tech. En utilisant nos services, vous acceptez les conditions ci-dessous.</p>
        <h2>1. Services</h2>
        <p>Nous fournissons vente de matériel, maintenance, développement, formation et rédaction de mémoire.</p>
        <h2>2. Commandes et paiements</h2>
        <p>Les commandes deviennent fermes après paiement. Nous acceptons Orange Money, MTN, Wave, carte, espèces et virement.</p>
        <h2>3. Garanties</h2>
        <p>Les produits neufs sont couverts par la garantie constructeur. Les réparations effectuées par nos techniciens sont garanties 30 jours.</p>
        <h2>4. Livraison</h2>
        <p>Les délais sont indicatifs. Nous mettons tout en œuvre pour livrer dans les meilleurs délais.</p>
        <h2>5. Responsabilité</h2>
        <p>Notre responsabilité est limitée au montant de la prestation. Les données sont sauvegardées à titre indicatif ; nous invitons chaque client à conserver ses propres sauvegardes.</p>
      </article>
    </PublicShell>
  ),
});
