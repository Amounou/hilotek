import { jsPDF } from "jspdf";
import { formatXOF } from "@/lib/i18n";
import logoAsset from "@/assets/alkof-logo.png.asset.json";

// jsPDF's built-in Helvetica renders NBSP (\u00A0) and NNBSP (\u202F) as "/".
// Intl.NumberFormat for XOF uses those spaces as thousand/currency separators,
// so we swap them for regular spaces before drawing.
const money = (n: number) => formatXOF(Number(n)).replace(/[\u00A0\u202F]/g, " ");

// Brand colors (matching the site tokens)
const NAVY: [number, number, number] = [30, 58, 110];
const ORANGE: [number, number, number] = [244, 143, 30];
const LIGHT: [number, number, number] = [243, 244, 246];
const DARK: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [107, 114, 128];

async function fetchLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(logoAsset.url);
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
  items: Array<{ product_name: string; quantity: number; unit_price: number; line_total: number }>;
};

export type CompanyForPdf = {
  company_name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type PdfMode = "save" | "print" | "open";

export async function generateSalePdf(
  sale: SaleForPdf,
  company: CompanyForPdf,
  mode: PdfMode | boolean = "save",
) {
  const resolved: PdfMode = typeof mode === "boolean" ? (mode ? "print" : "save") : mode;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await fetchLogoDataUrl();
  const pageW = 210;
  const pageH = 297;

  // ===== Decorative corners =====
  // Top-right layered orange + navy bands
  doc.setFillColor(...NAVY);
  doc.triangle(pageW - 60, 0, pageW, 0, pageW, 40, "F");
  doc.setFillColor(...ORANGE);
  doc.triangle(pageW - 40, 0, pageW, 0, pageW, 28, "F");
  // Bottom-left corner
  doc.setFillColor(...NAVY);
  doc.triangle(0, pageH, 60, pageH, 0, pageH - 40, "F");
  doc.setFillColor(...ORANGE);
  doc.triangle(0, pageH, 40, pageH, 0, pageH - 28, "F");

  // ===== Header =====
  if (logo) {
    try { doc.addImage(logo, "PNG", 14, 12, 24, 24); } catch { /* ignore */ }
  }
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...NAVY);
  doc.text(company.company_name || "@lkof Services & Tech", 42, 22);

  // FACTURE title (right side)
  doc.setFont("helvetica", "bold"); doc.setFontSize(34); doc.setTextColor(...ORANGE);
  doc.text("FACTURE", pageW - 16, 30, { align: "right" });

  // ===== Billed to / invoice meta =====
  const infoY = 56;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...DARK);
  doc.text("Facturé à", 16, infoY);
  doc.setFontSize(14); doc.setTextColor(...ORANGE);
  doc.text(sale.client_name, 16, infoY + 7);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED);
  let cy = infoY + 13;
  if (sale.client_email) { doc.text(sale.client_email, 16, cy); cy += 4; }
  if (sale.client_phone) { doc.text(sale.client_phone, 16, cy); cy += 4; }
  if (sale.client_address) { doc.text(String(sale.client_address).slice(0, 60), 16, cy); cy += 4; }

  // Invoice number + date block (right)
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...DARK);
  doc.text("N° de facture :", pageW - 78, infoY);
  doc.text("Date :", pageW - 78, infoY + 8);
  // Boxed invoice number
  doc.setDrawColor(...NAVY); doc.setLineWidth(0.6);
  doc.rect(pageW - 46, infoY - 4, 32, 6);
  doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
  doc.text(sale.invoice_number, pageW - 30, infoY, { align: "center" });
  doc.text(new Date(sale.sale_date).toLocaleDateString("fr-FR"), pageW - 30, infoY + 8, { align: "center" });

  // ===== Items table =====
  let y = Math.max(cy + 6, 92);
  const rowH = 9;
  // Header row: N° (orange) | Désignation (navy) | PU (navy) | Qté (navy) | Total (orange)
  const cols = {
    n: { x: 14, w: 14 },
    desig: { x: 28, w: 92 },
    pu: { x: 120, w: 28 },
    qte: { x: 148, w: 20 },
    total: { x: 168, w: 28 },
  };
  doc.setFillColor(...ORANGE);
  doc.rect(cols.n.x, y, cols.n.w, rowH, "F");
  doc.setFillColor(...NAVY);
  doc.rect(cols.desig.x, y, cols.desig.w, rowH, "F");
  doc.rect(cols.pu.x, y, cols.pu.w, rowH, "F");
  doc.rect(cols.qte.x, y, cols.qte.w, rowH, "F");
  doc.setFillColor(...ORANGE);
  doc.rect(cols.total.x, y, cols.total.w, rowH, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text("N°", cols.n.x + cols.n.w / 2, y + 6, { align: "center" });
  doc.text("Désignation", cols.desig.x + 3, y + 6);
  doc.text("Prix Unitaire", cols.pu.x + cols.pu.w / 2, y + 6, { align: "center" });
  doc.text("Qté", cols.qte.x + cols.qte.w / 2, y + 6, { align: "center" });
  doc.text("Total", cols.total.x + cols.total.w / 2, y + 6, { align: "center" });
  y += rowH;

  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...DARK);
  sale.items.forEach((it, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...LIGHT);
      doc.rect(cols.n.x, y, cols.total.x + cols.total.w - cols.n.x, rowH, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.text(String(i + 1).padStart(2, "0"), cols.n.x + cols.n.w / 2, y + 6, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(String(it.product_name).slice(0, 55), cols.desig.x + 3, y + 6);
    doc.text(formatXOF(Number(it.unit_price)), cols.pu.x + cols.pu.w - 2, y + 6, { align: "right" });
    doc.text(String(it.quantity).padStart(2, "0"), cols.qte.x + cols.qte.w / 2, y + 6, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(formatXOF(Number(it.line_total)), cols.total.x + cols.total.w - 2, y + 6, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += rowH;
    if (y > 220) { doc.addPage(); y = 20; }
  });

  // Empty spacer row
  doc.setFillColor(...LIGHT);
  doc.rect(cols.n.x, y, cols.total.x + cols.total.w - cols.n.x, rowH, "F");
  y += rowH + 8;

  // ===== Totals + payment info side-by-side =====
  const totalsX = 120;
  // Left: payment info
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...DARK);
  doc.text("Informations de paiement", 16, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED);
  let py = y + 6;
  if (company.phone) { doc.text(`Tél : ${company.phone}`, 16, py); py += 5; }
  if (company.email) { doc.text(company.email, 16, py); py += 5; }
  if (company.address) { doc.text(String(company.address).slice(0, 50), 16, py); py += 5; }
  doc.text("Paiement à réception de facture.", 16, py); py += 5;

  // Right: totals
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...DARK);
  doc.text("Sous-total", totalsX, y);
  doc.text(formatXOF(Number(sale.subtotal)), pageW - 16, y, { align: "right" });
  doc.text(`TVA (${Number(sale.tax_rate)}%)`, totalsX, y + 6);
  doc.text(formatXOF(Number(sale.tax_amount)), pageW - 16, y + 6, { align: "right" });

  // Total banner: orange label + navy amount
  const tY = y + 12;
  doc.setFillColor(...ORANGE);
  doc.rect(totalsX - 4, tY, 24, 10, "F");
  doc.setFillColor(...NAVY);
  doc.rect(totalsX + 20, tY, pageW - 16 - (totalsX + 20), 10, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("Total", totalsX + 8, tY + 6.8);
  doc.text(formatXOF(Number(sale.total)), pageW - 18, tY + 6.8, { align: "right" });

  // ===== Conditions & signature =====
  const cgY = Math.max(py + 10, tY + 24);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...DARK);
  doc.text("Conditions générales", 16, cgY);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED);
  const conditions = sale.notes && sale.notes.trim()
    ? sale.notes
    : "Merci de votre confiance. Marchandises vendues non reprises ni échangées sauf accord préalable.";
  const wrapped = doc.splitTextToSize(conditions, 95);
  doc.text(wrapped, 16, cgY + 6);

  // Signature
  doc.setDrawColor(...ORANGE); doc.setLineWidth(0.8);
  doc.line(totalsX, cgY + 10, pageW - 16, cgY + 10);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...DARK);
  doc.text("Signature autorisée", (totalsX + pageW - 16) / 2, cgY + 16, { align: "center" });
  if (sale.seller_name) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED);
    doc.text(sale.seller_name, (totalsX + pageW - 16) / 2, cgY + 21, { align: "center" });
  }

  // Footer
  doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text(`${company.company_name || "@lkof Services & Tech"} — Facture ${sale.invoice_number}`, pageW / 2, pageH - 8, { align: "center" });

  if (resolved === "print") {
    doc.autoPrint();
    const url = doc.output("bloburl");
    window.open(url, "_blank");
  } else if (resolved === "open") {
    const url = doc.output("bloburl");
    window.open(url, "_blank");
  } else {
    doc.save(`${sale.invoice_number}.pdf`);
  }
}
