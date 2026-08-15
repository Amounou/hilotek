// Traductions FR des statuts / énumérations affichés dans l'application.

const MAP: Record<string, string> = {
  // Commandes
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En traitement",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  completed: "Terminée",
  cancelled: "Annulée",
  refunded: "Remboursée",
  // Paiement
  unpaid: "Non payée",
  paid: "Payée",
  failed: "Échouée",
  // Réparations
  received: "Reçu",
  diagnosis: "Diagnostic",
  waiting_parts: "Attente pièces",
  in_repair: "En réparation",
  // Mémoires
  assigned: "Assigné",
  in_progress: "En cours",
  review: "Relecture",
  // Devis
  new: "Nouveau",
  in_review: "En étude",
  quoted: "Devis envoyé",
  accepted: "Accepté",
  rejected: "Refusé",
  expired: "Expiré",
  sent: "Envoyé",
  // Ventes / factures
  draft: "Brouillon",
  issued: "Émise",
  invoice: "Facture",
  receipt: "Reçu",
  quote: "Devis",
  delivery_note: "Bon de livraison",
  // Paiements
  orange_money: "Orange Money",
  mtn_money: "MTN Money",
  wave: "Wave",
  card: "Carte bancaire",
  cash: "Espèces",
  bank_transfer: "Virement bancaire",
  // Rôles
  super_admin: "Super admin",
  admin: "Administrateur",
  technician: "Technicien",
  cashier: "Caissier",
  commercial: "Commercial",
  warehouse: "Magasinier",
  writer: "Rédacteur",
  support: "Support",
  customer: "Client",
};

export function fr(value?: string | null): string {
  if (!value) return "—";
  return MAP[value] ?? value;
}
