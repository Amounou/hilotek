import { jsPDF } from "jspdf";
import { formatXOF } from "@/lib/i18n";
import logoAsset from "@/assets/alkof-logo.png.asset.json";

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

export async function generateSalePdf(sale: SaleForPdf, company: CompanyForPdf, autoPrint = false) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await fetchLogoDataUrl();
  const pageW = 210;

  // Header
  if (logo) {
    try { doc.addImage(logo, "PNG", 14, 12, 26, 26); } catch { /* ignore */ }
  }
  doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text(company.company_name || "@lkof Services & Tech", 44, 20);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  let hy = 26;
  if (company.address) { doc.text(company.address, 44, hy); hy += 4; }
  if (company.phone) { doc.text(`Tél: ${company.phone}`, 44, hy); hy += 4; }
  if (company.email) { doc.text(company.email, 44, hy); hy += 4; }

  // Invoice block
  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("FACTURE", pageW - 14, 20, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`N° ${sale.invoice_number}`, pageW - 14, 26, { align: "right" });
  doc.text(`Date : ${new Date(sale.sale_date).toLocaleDateString("fr-FR")}`, pageW - 14, 31, { align: "right" });

  // Client
  doc.setDrawColor(220); doc.line(14, 48, pageW - 14, 48);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Client", 14, 55);
  doc.setFont("helvetica", "normal");
  doc.text(sale.client_name, 14, 61);
  let cy = 66;
  if (sale.client_email) { doc.text(sale.client_email, 14, cy); cy += 5; }
  if (sale.client_phone) { doc.text(sale.client_phone, 14, cy); cy += 5; }
  if (sale.seller_name) doc.text(`Commercial: ${sale.seller_name}`, pageW - 14, 55, { align: "right" });

  // Items table
  let y = Math.max(cy, 78);
  doc.setFillColor(15, 23, 42); doc.rect(14, y, pageW - 28, 8, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text("Produit", 16, y + 5.5);
  doc.text("Qté", 120, y + 5.5, { align: "right" });
  doc.text("PU", 150, y + 5.5, { align: "right" });
  doc.text("HT", pageW - 16, y + 5.5, { align: "right" });
  y += 8;
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  sale.items.forEach((it, i) => {
    if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(14, y, pageW - 28, 7, "F"); }
    doc.text(String(it.product_name).slice(0, 60), 16, y + 5);
    doc.text(String(it.quantity), 120, y + 5, { align: "right" });
    doc.text(formatXOF(Number(it.unit_price)), 150, y + 5, { align: "right" });
    doc.text(formatXOF(Number(it.line_total)), pageW - 16, y + 5, { align: "right" });
    y += 7;
    if (y > 260) { doc.addPage(); y = 20; }
  });

  // Totals
  y += 6;
  doc.setDrawColor(220); doc.line(pageW - 90, y, pageW - 14, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text("Total HT :", pageW - 60, y); doc.text(formatXOF(Number(sale.subtotal)), pageW - 16, y, { align: "right" }); y += 6;
  doc.text(`TVA (${Number(sale.tax_rate)}%) :`, pageW - 60, y); doc.text(formatXOF(Number(sale.tax_amount)), pageW - 16, y, { align: "right" }); y += 6;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.setFillColor(15, 23, 42); doc.rect(pageW - 90, y - 4, 76, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("Total TTC :", pageW - 60, y + 2);
  doc.text(formatXOF(Number(sale.total)), pageW - 16, y + 2, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y += 18;

  if (sale.notes) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(9);
    doc.text(`Notes : ${sale.notes}`, 14, y); y += 6;
  }

  // Footer / signature
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text("Signature / Cachet", pageW - 60, 278);
  doc.setDrawColor(180); doc.rect(pageW - 60, 260, 46, 16);
  doc.setFontSize(8); doc.setTextColor(120);
  doc.text("Merci de votre confiance — @lkof Services & Tech", 105, 290, { align: "center" });

  if (autoPrint) {
    doc.autoPrint();
    const url = doc.output("bloburl");
    window.open(url, "_blank");
  } else {
    doc.save(`${sale.invoice_number}.pdf`);
  }
}
