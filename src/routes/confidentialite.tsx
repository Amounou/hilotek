import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({ meta: [{ title: "Politique de confidentialité — HiloTek" }] }),
  component: () => (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-16 prose prose-neutral dark:prose-invert">
        <h1>Politique de confidentialité</h1>
        <p>Vos données sont utilisées uniquement pour vous fournir nos services et améliorer votre expérience.</p>
        <h2>Données collectées</h2>
        <p>Nom, email, téléphone, adresse et informations liées à vos commandes/réparations/mémoires.</p>
        <h2>Utilisation</h2>
        <p>Traitement de vos demandes, suivi client, newsletter (si abonné). Nous ne revendons jamais vos données.</p>
        <h2>Vos droits</h2>
        <p>Vous pouvez à tout moment demander l'accès, la modification ou la suppression de vos données à contact@alkof.tech.</p>
      </article>
    </PublicShell>
  ),
});
