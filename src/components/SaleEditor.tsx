import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatXOF } from "@/lib/i18n";
import { Trash2, Plus, Save, Printer, X, Pencil } from "lucide-react";
import { generateSalePdf } from "@/lib/sales-pdf";
import { ProductThumb } from "@/components/ProductThumb";

type LineItem = {
  key: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  image?: string | null;
};

export type EditorMode = "sale" | "proforma";

type Props = {
  saleId?: string;       // edit existing
  fromSaleId?: string;   // duplicate
  mode?: EditorMode;
};

const CFG = {
  sale: {
    table: "sales",
    itemsTable: "sale_items",
    fk: "sale_id",
    numberCol: "invoice_number",
    dateCol: "sale_date",
    listPath: "/sales",
    newTitle: "Nouvelle Vente",
    editTitle: "Modifier la vente",
    docLabel: "Facture N°",
    pdfLabel: "FACTURE",
    itemWord: "article",
    itemWordCap: "Article",
    nameLabel: "Nom du produit",
    savedWord: "Vente",
  },
  proforma: {
    table: "proformas",
    itemsTable: "proforma_items",
    fk: "proforma_id",
    numberCol: "proforma_number",
    dateCol: "proforma_date",
    listPath: "/quotes/list",
    newTitle: "Devis",
    editTitle: "Modifier le devis",
    docLabel: "Facture Pro-forma N°",
    pdfLabel: "FACTURE PRO-FORMA",
    itemWord: "élément",
    itemWordCap: "Élément",
    nameLabel: "Nom de l'élément",
    savedWord: "Devis",
  },
} as const;

const newKey = () => Math.random().toString(36).slice(2, 10);

/** Lit un fichier image et le redimensionne en dataURL JPEG compacte */
const fileToThumbDataUrl = (file: File, max = 480): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

export function SaleEditor({ saleId, fromSaleId, mode = "sale" }: Props) {
  const nav = useNavigate();
  const { user } = useAuth();
  const cfg = CFG[mode];
  const db = supabase as any;

  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [taxRate, setTaxRate] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("(auto)");

  // Draft line
  const [dName, setDName] = useState("");
  const [dProductId, setDProductId] = useState<string | null>(null);
  const [dQty, setDQty] = useState<number>(1);
  const [dPrice, setDPrice] = useState<number>(0);
  const [dImage, setDImage] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { data: clients } = useQuery({
    queryKey: ["clients-min"],
    queryFn: async () => (await supabase.from("clients").select("id, full_name, email, phone").order("full_name")).data ?? [],
  });
  const { data: products } = useQuery({
    queryKey: ["products-min"],
    queryFn: async () => (await supabase.from("products").select("id, name_fr, price, promo_price, stock, sku, images").eq("is_active", true).order("name_fr")).data ?? [],
  });
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => (await supabase.rpc("get_public_settings")).data as any,
  });

  useEffect(() => { if (settings?.tax_rate != null && !saleId && !fromSaleId) setTaxRate(Number(settings.tax_rate)); }, [settings, saleId, fromSaleId]);

  // Load existing or duplicate
  useEffect(() => {
    const id = saleId ?? fromSaleId;
    if (!id) return;
    (async () => {
      const { data, error } = await db.from(cfg.table).select(`*, ${cfg.itemsTable}(*, products(images))`).eq("id", id).maybeSingle();
      if (error || !data) { toast.error("Document introuvable"); return; }
      setClientId(data.client_id);
      setClientName(data.client_name);
      setClientEmail(data.client_email ?? "");
      setClientPhone(data.client_phone ?? "");
      setTaxRate(Number(data.tax_rate));
      setNotes(data.notes ?? "");
      setItems((data[cfg.itemsTable] ?? []).map((it: any) => ({
        key: newKey(),
        product_id: it.product_id,
        product_name: it.product_name,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        image: it.image_url ?? it.products?.images?.[0] ?? null,
      })));
      if (saleId) {
        setSaleDate(String(data[cfg.dateCol]).slice(0, 10));
        setInvoiceNumber(data[cfg.numberCol] ?? "(auto)");
      }
    })();
  }, [saleId, fromSaleId, cfg, db]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.quantity * i.unit_price, 0), [items]);
  const taxAmount = useMemo(() => (subtotal * taxRate) / 100, [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const resetDraft = () => {
    setDName(""); setDProductId(null); setDQty(1); setDPrice(0); setDImage(null); setEditingKey(null);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const onSelectProduct = (id: string) => {
    const p = (products ?? []).find((x: any) => x.id === id);
    if (!p) return;
    setDProductId(id);
    setDName(p.name_fr);
    setDPrice(Number(p.promo_price ?? p.price));
    setDImage(p.images?.[0] ?? null);
  };

  const addLine = () => {
    const name = dName.trim();
    if (!name) { toast.error(`${cfg.nameLabel} requis`); nameInputRef.current?.focus(); return; }
    if (dQty <= 0) { toast.error("Quantité invalide"); return; }
    if (dPrice < 0) { toast.error("Prix invalide"); return; }
    if (mode === "sale" && dProductId) {
      const p = (products ?? []).find((x: any) => x.id === dProductId);
      const alreadyInCart = items.filter((i) => i.product_id === dProductId && i.key !== editingKey)
        .reduce((s, i) => s + i.quantity, 0);
      if (p && p.stock != null && alreadyInCart + dQty > p.stock) {
        toast.error(`Stock insuffisant (dispo: ${p.stock - alreadyInCart})`);
        return;
      }
    }
    if (editingKey) {
      setItems((prev) => prev.map((i) => i.key === editingKey
        ? { ...i, product_id: dProductId, product_name: name, quantity: dQty, unit_price: dPrice, image: dImage }
        : i));
    } else {
      setItems((prev) => [...prev, { key: newKey(), product_id: dProductId, product_name: name, quantity: dQty, unit_price: dPrice, image: dImage }]);
    }
    resetDraft();
  };

  const editLine = (k: string) => {
    const it = items.find((i) => i.key === k); if (!it) return;
    setEditingKey(k);
    setDName(it.product_name);
    setDProductId(it.product_id);
    setDQty(it.quantity);
    setDPrice(it.unit_price);
    setDImage(it.image ?? null);
    nameInputRef.current?.focus();
  };

  const removeLine = (k: string) => setItems((prev) => prev.filter((i) => i.key !== k));

  const save = async (thenPrint = false) => {
    if (!clientName.trim()) { toast.error("Client requis"); return; }
    if (items.length === 0) { toast.error(`Ajoutez au moins un ${cfg.itemWord}`); return; }
    setSaving(true);
    try {
      const seller = user?.user_metadata?.full_name ?? user?.email ?? null;
      const payload: any = {
        client_id: clientId,
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || null,
        client_phone: clientPhone.trim() || null,
        user_id: user?.id ?? null,
        seller_name: seller,
        [cfg.dateCol]: new Date(saleDate).toISOString(),
        tax_rate: taxRate,
        notes: notes.trim() || null,
        status: mode === "sale" ? "completed" : "draft",
      };

      let sid: string;
      if (saleId) {
        const { error } = await db.from(cfg.table).update(payload).eq("id", saleId);
        if (error) throw error;
        const del = await db.from(cfg.itemsTable).delete().eq(cfg.fk, saleId);
        if (del.error) throw del.error;
        sid = saleId;
      } else {
        const { data, error } = await db.from(cfg.table).insert(payload).select(`id, ${cfg.numberCol}`).single();
        if (error) throw error;
        sid = data.id;
        setInvoiceNumber(data[cfg.numberCol]);
      }

      const rows = items.map((i) => ({
        [cfg.fk]: sid,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        image_url: i.image ?? null,
      }));
      const { error: e2 } = await db.from(cfg.itemsTable).insert(rows);
      if (e2) throw e2;

      // Fetch to obtain server-computed totals + number
      const { data: fresh } = await db.from(cfg.table)
        .select(`*, ${cfg.itemsTable}(product_name, quantity, unit_price, line_total, product_id, image_url, products(images))`)
        .eq("id", sid).single();

      toast.success(`${cfg.savedWord} ${fresh?.[cfg.numberCol]} enregistré`);

      if (thenPrint && fresh) {
        const c: any = settings ?? {};
        await generateSalePdf(
          {
            invoice_number: fresh[cfg.numberCol],
            sale_date: fresh[cfg.dateCol],
            client_name: fresh.client_name,
            client_email: fresh.client_email,
            client_phone: fresh.client_phone,
            seller_name: fresh.seller_name,
            subtotal: Number(fresh.subtotal),
            tax_rate: Number(fresh.tax_rate),
            tax_amount: Number(fresh.tax_amount),
            total: Number(fresh.total),
            notes: fresh.notes,
            doc_label: cfg.pdfLabel,
            items: (fresh[cfg.itemsTable] ?? []).map((i: any) => ({
              product_name: i.product_name,
              quantity: Number(i.quantity),
              unit_price: Number(i.unit_price),
              line_total: Number(i.line_total),
              image: i.image_url ?? i.products?.images?.[0] ?? items.find((x) => x.product_id === i.product_id)?.image ?? null,
            })),
          },
          {
            company_name: c.company_name ?? "HiloTek Services & Tech",
            address: c.address, phone: c.phone, email: c.email,
          },
          true,
        );
      }
      nav({ to: cfg.listPath as any });
    } catch (e: any) {
      toast.error(e.message ?? "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">{saleId ? cfg.editTitle : cfg.newTitle}</h1>
          <p className="text-sm text-muted-foreground">{cfg.docLabel} {invoiceNumber}</p>
        </div>
        <Button variant="ghost" onClick={() => nav({ to: cfg.listPath as any })}><X className="h-4 w-4 mr-1" />Annuler</Button>
      </div>

      <Card className="p-4 grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <Label>Client *</Label>
          <Input list="clients-list" value={clientName} onChange={(e) => {
            const v = e.target.value; setClientName(v);
            const m = (clients ?? []).find((c: any) => c.full_name === v);
            if (m) { setClientId(m.id); setClientEmail(m.email ?? ""); setClientPhone(m.phone ?? ""); }
            else setClientId(null);
          }} placeholder="Nom du client (ou sélection)" />
          <datalist id="clients-list">
            {(clients ?? []).map((c: any) => <option key={c.id} value={c.full_name} />)}
          </datalist>
        </div>
        <div><Label>Email</Label><Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></div>
        <div><Label>Téléphone</Label><Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} /></div>
        <div><Label>Date</Label><Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} /></div>
        <div><Label>Commercial</Label><Input value={user?.email ?? ""} readOnly /></div>
        <div><Label>Taux TVA (%)</Label><Input type="number" min={0} step="0.01" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value) || 0)} /></div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Ajouter un {cfg.itemWord}</h2>
        <div className="grid gap-2 md:grid-cols-12 items-end">
          <div className="md:col-span-5">
            <Label className="flex items-center gap-2">{cfg.nameLabel}{dImage && <ProductThumb src={dImage} size={28} />}</Label>
            <Input
              ref={nameInputRef}
              list="products-list"
              value={dName}
              onChange={(e) => {
                const v = e.target.value; setDName(v);
                const p = (products ?? []).find((x: any) => x.name_fr === v);
                        if (p) onSelectProduct(p.id); else { setDProductId(null); setDImage(null); }
              }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLine(); } }}
              placeholder={mode === "sale" ? "Rechercher un produit ou saisir librement" : "Rechercher un produit/service ou saisir librement"}
            />
            <datalist id="products-list">
              {(products ?? []).map((p: any) => (
                <option key={p.id} value={p.name_fr}>{`${formatXOF(Number(p.promo_price ?? p.price))} · stock ${p.stock}`}</option>
              ))}
            </datalist>
          </div>
          <div className="md:col-span-2">
            <Label>Quantité</Label>
            <Input type="number" min={1} step="1" value={dQty} onChange={(e) => setDQty(Number(e.target.value) || 0)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLine(); } }} />
          </div>
          <div className="md:col-span-2">
            <Label>Prix unitaire</Label>
            <Input type="number" min={0} step="1" value={dPrice} onChange={(e) => setDPrice(Number(e.target.value) || 0)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLine(); } }} />
          </div>
          <div className="md:col-span-2">
            <Label>Prix HT</Label>
            <Input readOnly value={formatXOF(dQty * dPrice)} />
          </div>
          <div className="md:col-span-1">
            <Button className="w-full gradient-brand text-brand-foreground border-0" onClick={addLine}>
              <Plus className="h-4 w-4 mr-1" />{editingKey ? "OK" : "Ajouter"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
                  <TableHead>{mode === "sale" ? "Produit" : "Élément"}</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead className="text-right">Prix unitaire</TableHead>
              <TableHead className="text-right">Prix HT</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Aucun {cfg.itemWord}</TableCell></TableRow>)}
            {items.map((i) => (
              <TableRow key={i.key} className={editingKey === i.key ? "bg-muted/50" : ""}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ProductThumb src={i.image} alt={i.product_name} size={40} />
                    <span>{i.product_name}{mode === "sale" && !i.product_id && <span className="ml-2 text-xs text-muted-foreground">(hors stock)</span>}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{i.quantity}</TableCell>
                <TableCell className="text-right">{formatXOF(i.unit_price)}</TableCell>
                <TableCell className="text-right font-semibold">{formatXOF(i.quantity * i.unit_price)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" onClick={() => editLine(i.key)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => removeLine(i.key)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <Label>Notes</Label>
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions, mode de paiement, etc." />
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex justify-between"><span>Total HT</span><span className="font-medium">{formatXOF(subtotal)}</span></div>
          <div className="flex justify-between text-sm text-muted-foreground"><span>TVA ({taxRate}%)</span><span>{formatXOF(taxAmount)}</span></div>
          <div className="border-t pt-2 flex justify-between text-lg font-bold"><span>Total TTC</span><span>{formatXOF(total)}</span></div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="ghost" onClick={() => nav({ to: cfg.listPath as any })}><X className="h-4 w-4 mr-1" />Annuler</Button>
        <Button variant="outline" disabled={saving} onClick={() => save(false)}><Save className="h-4 w-4 mr-1" />Enregistrer</Button>
        <Button className="gradient-brand text-brand-foreground border-0" disabled={saving} onClick={() => save(true)}>
          <Printer className="h-4 w-4 mr-1" />Enregistrer et Imprimer
        </Button>
      </div>
    </div>
  );
}
