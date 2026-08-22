import { jsPDF } from "jspdf";
import { formatXOF } from "@/lib/i18n";

// jsPDF's built-in Helvetica renders NBSP (\u00A0) and NNBSP (\u202F) as "/".
// Intl.NumberFormat for XOF uses those spaces as thousand/currency separators,
// so we swap them for regular spaces before drawing.
const money = (n: number) => formatXOF(Number(n)).replace(/[\u00A0\u202F]/g, " ");

// Brand colors (matching the site tokens)
const NAVY: [number, number, number] = [27, 62, 146]; // bleu du logo
const ORANGE: [number, number, number] = [242, 107, 33]; // orange du logo
const LIGHT: [number, number, number] = [243, 244, 246];
const DARK: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [107, 114, 128];

async function fetchLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/alkof-logo.png");
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export type SaleForPdf = {
  invoice_number: string;
  sale_date: string;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  seller_name?: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string | null;
  doc_label?: string | null;
  items: Array<{ product_name: string; quantity: number; unit_price: number; line_total: number }>;
};


export type CompanyForPdf = {
  company_name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type PdfMode = "save" | "print" | "open";
export type PdfFormat = "a4" | "a5";

export async function generateSalePdf(
  sale: SaleForPdf,
  company: CompanyForPdf,
  mode: PdfMode | boolean = "save",
  format: PdfFormat = "a4",
) {
  const resolved: PdfMode = typeof mode === "boolean" ? (mode ? "print" : "save") : mode;
  const doc = new jsPDF({ unit: "mm", format });
  const logo = await fetchLogoDataUrl();

  // Real page dimensions in mm (A4: 210x297, A5: 148x210).
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Everything is designed on the A4 reference (210mm wide) then scaled to fit.
  const s = pageW / 210;
  const S = (n: number) => n * s;           // scale distances
  const F = (n: number) => Math.max(6, n * s); // scale font sizes with a min

  // ===== Decorative corners =====
  doc.setFillColor(...NAVY);
  doc.triangle(pageW - S(60), 0, pageW, 0, pageW, S(40), "F");
  doc.setFillColor(...ORANGE);
  doc.triangle(pageW - S(40), 0, pageW, 0, pageW, S(28), "F");
  doc.setFillColor(...NAVY);
  doc.triangle(0, pageH, S(60), pageH, 0, pageH - S(40), "F");
  doc.setFillColor(...ORANGE);
  doc.triangle(0, pageH, S(40), pageH, 0, pageH - S(28), "F");

  // ===== Header =====
  if (logo) {
    try { doc.addImage(logo, "PNG", S(14), S(12), S(24), S(24)); } catch { /* ignore */ }
  }
  doc.setFont("helvetica", "bold"); doc.setFontSize(F(14)); doc.setTextColor(...NAVY);
  doc.text(company.company_name || "@lkof Services & Tech", S(42), S(22));

  doc.setFont("helvetica", "bold"); doc.setFontSize(F(34)); doc.setTextColor(...ORANGE);
  const docLabel = sale.doc_label || "FACTURE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(F(docLabel.length > 10 ? 20 : 34));
  doc.setTextColor(...ORANGE);
  doc.text(docLabel, pageW - S(16), S(30), { align: "right" });


  // ===== Billed to / invoice meta =====
  const infoY = S(56);
  doc.setFont("helvetica", "bold"); doc.setFontSize(F(11)); doc.setTextColor(...DARK);
  doc.text("Facturé à", S(16), infoY);
  doc.setFontSize(F(14)); doc.setTextColor(...ORANGE);
  doc.text(sale.client_name, S(16), infoY + S(7));
  doc.setFont("helvetica", "normal"); doc.setFontSize(F(9)); doc.setTextColor(...MUTED);
  let cy = infoY + S(13);
  if (sale.client_email) { doc.text(sale.client_email, S(16), cy); cy += S(4); }
  if (sale.client_phone) { doc.text(sale.client_phone, S(16), cy); cy += S(4); }
  if (sale.client_address) { doc.text(String(sale.client_address).slice(0, 60), S(16), cy); cy += S(4); }

  // Invoice number + date block (right)
  doc.setFont("helvetica", "bold"); doc.setFontSize(F(10)); doc.setTextColor(...DARK);
  doc.text("N° de facture :", pageW - S(78), infoY);
  doc.text("Date :", pageW - S(78), infoY + S(8));
  doc.setDrawColor(...NAVY); doc.setLineWidth(0.6 * s);
  doc.rect(pageW - S(46), infoY - S(4), S(32), S(6));
  doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
  doc.text(sale.invoice_number, pageW - S(30), infoY, { align: "center" });
  doc.text(new Date(sale.sale_date).toLocaleDateString("fr-FR"), pageW - S(30), infoY + S(8), { align: "center" });

  // ===== Items table =====
  let y = Math.max(cy + S(6), S(92));
  const rowH = S(9);
  const cols = {
    n:     { x: S(14),  w: S(14) },
    desig: { x: S(28),  w: S(92) },
    pu:    { x: S(120), w: S(28) },
    qte:   { x: S(148), w: S(20) },
    total: { x: S(168), w: S(28) },
  };
  doc.setFillColor(...ORANGE);
  doc.rect(cols.n.x, y, cols.n.w, rowH, "F");
  doc.setFillColor(...NAVY);
  doc.rect(cols.desig.x, y, cols.desig.w, rowH, "F");
  doc.rect(cols.pu.x, y, cols.pu.w, rowH, "F");
  doc.rect(cols.qte.x, y, cols.qte.w, rowH, "F");
  doc.setFillColor(...ORANGE);
  doc.rect(cols.total.x, y, cols.total.w, rowH, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(F(9));
  const hY = y + rowH / 2 + S(1.5);
  doc.text("N°", cols.n.x + cols.n.w / 2, hY, { align: "center" });
  doc.text("Désignation", cols.desig.x + S(3), hY);
  doc.text("Prix Unitaire", cols.pu.x + cols.pu.w / 2, hY, { align: "center" });
  doc.text("Qté", cols.qte.x + cols.qte.w / 2, hY, { align: "center" });
  doc.text("Total", cols.total.x + cols.total.w / 2, hY, { align: "center" });
  y += rowH;

  const bottomLimit = pageH - S(70);

  doc.setFont("helvetica", "normal"); doc.setFontSize(F(9)); doc.setTextColor(...DARK);
  sale.items.forEach((it, i) => {
    const lines: string[] = doc.splitTextToSize(String(it.product_name), cols.desig.w - S(6));
    const dynH = Math.max(rowH, lines.length * S(5) + S(4));
    if (y + dynH > bottomLimit) { doc.addPage(); y = S(20); }
    if (i % 2 === 0) {
      doc.setFillColor(...LIGHT);
      doc.rect(cols.n.x, y, cols.total.x + cols.total.w - cols.n.x, dynH, "F");
    }
    const centerY = y + dynH / 2 + S(1.5);
    doc.setFont("helvetica", "bold");
    doc.text(String(i + 1).padStart(2, "0"), cols.n.x + cols.n.w / 2, centerY, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(lines, cols.desig.x + S(3), y + S(5));
    doc.text(money(Number(it.unit_price)), cols.pu.x + cols.pu.w - S(2), centerY, { align: "right" });
    doc.text(String(it.quantity).padStart(2, "0"), cols.qte.x + cols.qte.w / 2, centerY, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(money(Number(it.line_total)), cols.total.x + cols.total.w - S(2), centerY, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += dynH;
  });

  // Empty spacer row
  doc.setFillColor(...LIGHT);
  doc.rect(cols.n.x, y, cols.total.x + cols.total.w - cols.n.x, rowH, "F");
  y += rowH + S(8);

  // ===== Totals + payment info side-by-side =====
  const totalsX = S(120);
  doc.setFont("helvetica", "bold"); doc.setFontSize(F(11)); doc.setTextColor(...DARK);
  doc.text("Informations de paiement", S(16), y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(F(9)); doc.setTextColor(...MUTED);
  let py = y + S(6);
  if (company.phone)   { doc.text(`Tél : ${company.phone}`, S(16), py); py += S(5); }
  if (company.email)   { doc.text(company.email, S(16), py); py += S(5); }
  if (company.address) { doc.text(String(company.address).slice(0, 50), S(16), py); py += S(5); }
  doc.text("Paiement à réception de facture.", S(16), py); py += S(5);

  doc.setFont("helvetica", "normal"); doc.setFontSize(F(10)); doc.setTextColor(...DARK);
  doc.text("Sous-total", totalsX, y);
  doc.text(money(Number(sale.subtotal)), pageW - S(16), y, { align: "right" });
  doc.text(`TVA (${Number(sale.tax_rate)}%)`, totalsX, y + S(6));
  doc.text(money(Number(sale.tax_amount)), pageW - S(16), y + S(6), { align: "right" });

  const tY = y + S(12);
  doc.setFillColor(...ORANGE);
  doc.rect(totalsX - S(4), tY, S(24), S(10), "F");
  doc.setFillColor(...NAVY);
  doc.rect(totalsX + S(20), tY, pageW - S(16) - (totalsX + S(20)), S(10), "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(F(12));
  doc.text("Total", totalsX + S(8), tY + S(6.8));
  doc.text(money(Number(sale.total)), pageW - S(18), tY + S(6.8), { align: "right" });

  // ===== Conditions & signature =====
  const cgY = Math.max(py + S(10), tY + S(24));
  doc.setFont("helvetica", "bold"); doc.setFontSize(F(11)); doc.setTextColor(...DARK);
  doc.text("Conditions générales", S(16), cgY);
  doc.setFont("helvetica", "normal"); doc.setFontSize(F(9)); doc.setTextColor(...MUTED);
  const conditions = sale.notes && sale.notes.trim()
    ? sale.notes
    : "Merci de votre confiance. Marchandises vendues non reprises ni échangées sauf accord préalable.";
  const wrapped = doc.splitTextToSize(conditions, S(95));
  doc.text(wrapped, S(16), cgY + S(6));

  doc.setDrawColor(...ORANGE); doc.setLineWidth(0.8 * s);
  doc.line(totalsX, cgY + S(10), pageW - S(16), cgY + S(10));
  doc.setFont("helvetica", "bold"); doc.setFontSize(F(10)); doc.setTextColor(...DARK);
  doc.text("Signature autorisée", (totalsX + pageW - S(16)) / 2, cgY + S(16), { align: "center" });
  if (sale.seller_name) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(F(9)); doc.setTextColor(...MUTED);
    doc.text(sale.seller_name, (totalsX + pageW - S(16)) / 2, cgY + S(21), { align: "center" });
  }

  // Footer
  doc.setFontSize(F(8)); doc.setTextColor(...MUTED);
  doc.text(`${company.company_name || "@lkof Services & Tech"} — ${docLabel.charAt(0) + docLabel.slice(1).toLowerCase()} ${sale.invoice_number}`, pageW / 2, pageH - S(8), { align: "center" });

  const suffix = format === "a5" ? "-A5" : "";
  if (resolved === "print") {
    doc.autoPrint();
    const url = doc.output("bloburl");
    window.open(url, "_blank");
  } else if (resolved === "open") {
    const url = doc.output("bloburl");
    window.open(url, "_blank");
  } else {
    doc.save(`${sale.invoice_number}${suffix}.pdf`);
  }
}
