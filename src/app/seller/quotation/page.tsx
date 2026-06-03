"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileTextIcon } from "@/components/Icons";

const UNITS = ["g", "kg", "mL", "L", "unit"] as const;
type Unit = (typeof UNITS)[number];

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  baseUnit: Unit;
  basePrice: any;
  stock: any;
  status: string;
}

interface QuoteItem {
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  orderedUnit: Unit;
  baseUnit: Unit;
  baseQty: number;
  basePrice: number;
  lineTotal: number;
}

function QuotationBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skuParam = searchParams.get("sku");

  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form State for Current Item Add
  const [selectedProductId, setSelectedProductId] = useState("");
  const [orderedQty, setOrderedQty] = useState<number>(1);
  const [orderedUnit, setOrderedUnit] = useState<Unit>("g");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          const active = data.filter((p: Product) => p.status === "active");
          setProducts(active);

          if (active.length > 0) {
            // Default select first or matching SKU
            const match = skuParam ? active.find((p: Product) => p.sku === skuParam) : active[0];
            const p = match || active[0];
            setSelectedProductId(p.id);
            setOrderedUnit(p.baseUnit);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [skuParam]);

  const activeProduct = products.find((p) => p.id === selectedProductId);

  // Math calculations preview
  let previewBaseQty = 0;
  let previewLineTotal = 0;
  let conversionWarning = "";

  if (activeProduct) {
    const qty = orderedQty || 0;
    const baseUnit = activeProduct.baseUnit;
    const basePrice = typeof activeProduct.basePrice === "string" ? parseFloat(activeProduct.basePrice) : activeProduct.basePrice;

    // Check dimensions
    const isWeight = (u: string) => ["g", "kg"].includes(u);
    const isVolume = (u: string) => ["mL", "L"].includes(u);

    if (orderedUnit === baseUnit) {
      previewBaseQty = qty;
    } else if (isWeight(orderedUnit) && isWeight(baseUnit)) {
      previewBaseQty = orderedUnit === "kg" && baseUnit === "g" ? qty * 1000 : qty / 1000;
    } else if (isVolume(orderedUnit) && isVolume(baseUnit)) {
      previewBaseQty = orderedUnit === "L" && baseUnit === "mL" ? qty * 1000 : qty / 1000;
    } else {
      conversionWarning = `Incompatible units: Stored in ${baseUnit}, cannot pack as ${orderedUnit}`;
    }

    previewLineTotal = previewBaseQty * basePrice;
  }

  const handleAddItem = () => {
    if (!activeProduct || conversionWarning || orderedQty <= 0) return;

    const basePrice = typeof activeProduct.basePrice === "string" ? parseFloat(activeProduct.basePrice) : activeProduct.basePrice;

    const newItem: QuoteItem = {
      productId: activeProduct.id,
      productName: activeProduct.name,
      sku: activeProduct.sku,
      orderedQty,
      orderedUnit,
      baseUnit: activeProduct.baseUnit,
      baseQty: previewBaseQty,
      basePrice,
      lineTotal: previewLineTotal,
    };

    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    try {
      setSubmitLoading(true);
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, notes }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit quotation");
      }

      router.push("/seller/orders");
    } catch (e: any) {
      alert(e.message || "Failed to submit quotation");
    } finally {
      setSubmitLoading(false);
    }
  };

  const grandTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const formatINR = (n: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 4,
    }).format(n);
  };

  if (loading) {
    return <div className="glass-panel empty"><div className="empty-title">Loading Quote builder...</div></div>;
  }

  return (
    <div style={{ maxWidth: 1200 }} className="animate-fade-in">
      <style jsx>{`
        .page-heading { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.6px; margin-bottom: 4px; }
        .page-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 32px; }
        
        .layout { display: grid; grid-template-columns: 1fr 440px; gap: 24px; align-items: start; }
        
        .panel { padding: 28px; }
        .panel-title { font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 20px; border-bottom: 1px solid rgba(0, 0, 0, 0.04); padding-bottom: 12px; }
        
        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .form-label { font-family: var(--font-display); font-size: 12px; font-weight: 800; color: var(--text-primary); }
        
        .input-plain { width: 100%; background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(0, 0, 0, 0.08); border-radius: var(--radius); padding: 10px 14px; color: var(--text-primary); font-family: var(--font-body); font-size: 14px; outline: none; transition: all 0.15s; }
        .input-plain:focus { border-color: var(--text-secondary); background: #ffffff; }
        
        .row-qty { display: grid; grid-template-columns: 1fr 120px; gap: 16px; }
        
        /* Math display */
        .math-box { background: rgba(255, 255, 255, 0.35); border: 1px solid rgba(0, 0, 0, 0.04); border-radius: var(--radius); padding: 16px; margin-top: 10px; }
        .math-title { font-family: var(--font-display); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 12px; }
        .math-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
        .math-row:last-child { margin-bottom: 0; }
        .math-row strong { color: var(--text-primary); font-family: var(--font-mono); }
        
        .btn-add { background: #1e1b4b; color: #fff; border: none; padding: 12px 20px; border-radius: 20px; font-family: var(--font-display); font-size: 13px; font-weight: 700; cursor: pointer; width: 100%; margin-top: 16px; transition: all 0.15s; box-shadow: 0 4px 12px rgba(30, 27, 75, 0.15); }
        .btn-add:hover:not(:disabled) { background: #0f0d2b; }
        .btn-add:disabled { background: rgba(0, 0, 0, 0.06); color: var(--text-light); cursor: not-allowed; box-shadow: none; border: 1px solid rgba(0, 0, 0, 0.04); }
        
        /* Right sidebar items */
        .item-list { max-height: 380px; overflow-y: auto; margin-bottom: 20px; }
        .item-row { background: rgba(255, 255, 255, 0.3); border: 1px solid rgba(0, 0, 0, 0.04); border-radius: var(--radius); padding: 14px; margin-bottom: 10px; position: relative; }
        .item-name { font-weight: 700; color: var(--text-primary); font-size: 13px; padding-right: 24px; }
        .item-sku { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }
        .item-qty-row { display: flex; justify-content: space-between; margin-top: 8px; align-items: flex-end; }
        .item-qty { font-size: 12px; color: var(--text-muted); }
        .item-qty span { font-family: var(--font-mono); color: var(--text-primary); font-weight: 700; }
        .item-total { font-family: var(--font-mono); font-size: 13px; color: var(--text-secondary); font-weight: 700; }
        
        .item-remove { position: absolute; right: 12px; top: 12px; background: transparent; border: none; font-size: 16px; color: var(--text-light); cursor: pointer; line-height: 1; }
        .item-remove:hover { color: #ef4444; }
        
        .grand-total { background: var(--accent-dim); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: var(--radius); padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .grand-label { font-family: var(--font-display); font-size: 14px; font-weight: 800; color: var(--text-primary); }
        .grand-value { font-family: var(--font-mono); font-size: 18px; font-weight: 800; color: var(--text-secondary); }
        
        .btn-submit { background: #10b981; color: #fff; border: none; padding: 12px 20px; border-radius: 20px; font-family: var(--font-display); font-size: 13px; font-weight: 700; cursor: pointer; width: 100%; transition: all 0.15s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15); }
        .btn-submit:hover:not(:disabled) { background: #059669; }
        .btn-submit:disabled { background: rgba(0, 0, 0, 0.06); color: var(--text-light); cursor: not-allowed; box-shadow: none; border: 1px solid rgba(0, 0, 0, 0.04); }
        
        .empty { text-align: center; padding: 48px 24px; }
        .empty-icon-sm { color: var(--text-light); margin-bottom: 12px; display: flex; justify-content: center; }
        .empty-title-sm { font-family: var(--font-display); font-size: 14px; color: var(--text-primary); margin-bottom: 4px; font-weight: 700; }
      `}</style>

      <h1 className="page-heading">Quotation Builder</h1>
      <p className="page-sub">Compile multiple chemical specs and check converted rate totals</p>

      <div className="layout">
        {/* Left selector */}
        <div className="glass-panel panel">
          <h2 className="panel-title">Add Chemical Spec</h2>

          {products.length === 0 ? (
            <div style={{ color: "var(--text-muted)" }}>No active products available in catalog.</div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Select Product</label>
                <select
                  className="input-plain"
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const p = products.find((pr) => pr.id === e.target.value);
                    if (p) setOrderedUnit(p.baseUnit);
                  }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ordered Pack Quantity</label>
                <div className="row-qty">
                  <input
                    className="input-plain"
                    type="number"
                    min="0.000001"
                    value={orderedQty}
                    onChange={(e) => setOrderedQty(parseFloat(e.target.value) || 0)}
                  />
                  <select
                    className="input-plain"
                    value={orderedUnit}
                    onChange={(e) => setOrderedUnit(e.target.value as Unit)}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activeProduct && (
                <div className="math-box">
                  <div className="math-title">Unit Conversion Math Preview</div>
                  {conversionWarning ? (
                    <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 700 }}>{conversionWarning}</div>
                  ) : (
                    <>
                      <div className="math-row">
                        <span>Base Storage Unit:</span>
                        <strong>{activeProduct.baseUnit}</strong>
                      </div>
                      <div className="math-row">
                        <span>Base Storage Price:</span>
                        <strong>{formatINR(typeof activeProduct.basePrice === "string" ? parseFloat(activeProduct.basePrice) : activeProduct.basePrice)} per {activeProduct.baseUnit}</strong>
                      </div>
                      {orderedUnit !== activeProduct.baseUnit && (
                        <div className="math-row">
                          <span>Converted Quantity:</span>
                          <strong>{previewBaseQty.toLocaleString()} {activeProduct.baseUnit}</strong>
                        </div>
                      )}
                      <div className="math-row" style={{ borderTop: "1px solid rgba(0,0,0,0.04)", paddingTop: 8, marginTop: 8 }}>
                        <span style={{ fontWeight: 800 }}>Estimated Line Total:</span>
                        <strong style={{ color: "var(--text-secondary)" }}>{formatINR(previewLineTotal)}</strong>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                className="btn-add"
                onClick={handleAddItem}
                disabled={!activeProduct || !!conversionWarning || orderedQty <= 0}
              >
                Add to Quotation
              </button>
            </>
          )}
        </div>

        {/* Right summary panel */}
        <div className="glass-panel panel">
          <h2 className="panel-title">Quotation Summary</h2>

          <div className="item-list">
            {items.length === 0 ? (
              <div className="empty">
                <div className="empty-icon-sm">
                  <FileTextIcon size={32} />
                </div>
                <div className="empty-title-sm">Quotation is empty</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Add items from the panel to get started</div>
              </div>
            ) : (
              items.map((item, idx) => (
                <div className="item-row animate-slide-left" key={idx}>
                  <button className="item-remove" onClick={() => handleRemoveItem(idx)}>
                    ×
                  </button>
                  <div className="item-name">{item.productName}</div>
                  <div className="item-sku">{item.sku}</div>
                  <div className="item-qty-row">
                    <div>
                      <div className="item-qty">
                        Ordered: <span>{item.orderedQty.toLocaleString()} {item.orderedUnit}</span>
                      </div>
                      {item.orderedUnit !== item.baseUnit && (
                        <div style={{ fontSize: 10, color: "var(--text-light)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                          → {item.baseQty.toLocaleString()} {item.baseUnit}
                        </div>
                      )}
                    </div>
                    <span className="item-total">{formatINR(item.lineTotal)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <>
              <div className="grand-total">
                <span className="grand-label">Grand Total</span>
                <span className="grand-value">{formatINR(grandTotal)}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Instructions</label>
                <textarea
                  className="input-plain"
                  style={{ minHeight: 80, resize: "none" }}
                  placeholder="e.g. Needs specialized refrigeration packaging format"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button className="btn-submit" onClick={handleSubmit} disabled={submitLoading}>
                {submitLoading ? "Submitting Quotation..." : "Submit Quotation Request"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SellerQuotationPage() {
  return (
    <Suspense fallback={<div className="glass-panel empty"><div className="empty-title">Loading builder...</div></div>}>
      <QuotationBuilderContent />
    </Suspense>
  );
}
