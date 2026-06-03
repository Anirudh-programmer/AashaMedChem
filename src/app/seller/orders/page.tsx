"use client";

import { useState, useEffect } from "react";
import { ClipboardIcon } from "@/components/Icons";

type Status = "pending" | "approved" | "rejected" | "fulfilled";

interface QuotationItem {
  productName: string;
  sku: string;
  orderedQty: any;
  orderedUnit: string;
  baseUnit: string;
  baseQty: any;
  basePrice: any;
  lineTotal: any;
}

interface Quotation {
  id: string;
  sellerName: string;
  sellerEmail: string;
  createdAt: string;
  status: Status;
  items: QuotationItem[];
  total: any;
  notes: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Pending", color: "#d97706", bg: "var(--amber-dim)", border: "rgba(217, 119, 6, 0.15)" },
  approved: { label: "Approved", color: "#10b981", bg: "rgba(16, 185, 129, 0.06)", border: "rgba(16, 185, 129, 0.15)" },
  rejected: { label: "Rejected", color: "#ef4444", bg: "var(--red-dim)", border: "rgba(239, 68, 68, 0.15)" },
  fulfilled: { label: "Fulfilled", color: "var(--text-secondary)", bg: "var(--accent-dim)", border: "rgba(99, 102, 241, 0.15)" },
};

const formatINR = (n: any) => {
  const val = typeof n === "string" ? parseFloat(n) : n;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 4,
  }).format(val || 0);
};

const parseNum = (n: any) => (typeof n === "string" ? parseFloat(n) : n) || 0;

export default function SellerOrdersPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/quotations");
      if (!res.ok) throw new Error("Failed to load your quotations");
      const data = await res.json();
      setQuotations(data);

      if (selected) {
        const updatedSelected = data.find((q: Quotation) => q.id === selected.id);
        if (updatedSelected) setSelected(updatedSelected);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const filtered = filter === "all" ? quotations : quotations.filter((q) => q.status === filter);

  return (
    <div style={{ maxWidth: 1320 }} className="animate-fade-in">
      <style jsx>{`
        .page-heading { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.6px; margin-bottom: 4px; }
        .page-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 32px; }
        
        .filter-tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
        .filter-tab { padding: 8px 18px; border-radius: 20px; font-family: var(--font-display); font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid rgba(0,0,0,0.06); background: rgba(255,255,255,0.4); color: var(--text-primary); transition: all 0.15s; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .filter-tab.active { background: #ffffff; color: var(--text-primary); border-color: rgba(255,255,255,0.6); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .filter-tab:hover:not(.active) { background: rgba(255,255,255,0.6); }
        
        .layout { display: grid; grid-template-columns: 1fr 420px; gap: 24px; align-items: start; }
        
        .qt-id { font-family: var(--font-mono); font-size: 13px; color: var(--text-secondary); font-weight: 700; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; border: 1px solid; text-transform: uppercase; letter-spacing: 0.05em; }
        .total-val { font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--text-primary); }
        
        .quotation-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .quotation-card {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--glass-shadow);
        }
        .quotation-card:hover {
          background: rgba(255, 255, 255, 0.75);
          border-color: rgba(255, 255, 255, 0.8);
          transform: translateY(-1px);
        }
        .quotation-card.active {
          background: #ffffff;
          border-color: rgba(255, 255, 255, 0.95);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
        }
        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .card-body-row {
          margin-bottom: 12px;
        }
        .card-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(0, 0, 0, 0.03);
          padding-top: 12px;
        }
        .card-date {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-light);
        }
        .card-total-val {
          font-family: var(--font-mono);
          font-size: 16px;
          font-weight: 800;
          color: var(--text-secondary);
        }
        .empty-state-list {
          padding: 48px;
          text-align: center;
          color: var(--text-light);
          background: rgba(255, 255, 255, 0.25);
          border-radius: var(--radius-lg);
          border: 1px dashed rgba(0, 0, 0, 0.06);
        }
        
        /* Detail panel */
        .detail-panel { overflow: hidden; position: sticky; top: 96px; }
        .detail-header { padding: 24px; border-bottom: 1px solid rgba(0, 0, 0, 0.04); background: rgba(255, 255, 255, 0.2); }
        .detail-title { font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
        .detail-meta { font-size: 12px; color: var(--text-muted); }
        .detail-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .detail-section-label { font-family: var(--font-display); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 12px; }
        
        .item-row { background: rgba(255, 255, 255, 0.3); border: 1px solid rgba(0, 0, 0, 0.04); border-radius: var(--radius); padding: 14px; margin-bottom: 10px; }
        .item-row:last-child { margin-bottom: 0; }
        .item-name { font-weight: 700; color: var(--text-primary); font-size: 13px; }
        .item-sku { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
        .item-qty-row { display: flex; justify-content: space-between; margin-top: 8px; align-items: flex-end; }
        .item-qty { font-size: 13px; color: var(--text-muted); }
        .item-qty span { font-family: var(--font-mono); color: var(--text-primary); font-weight: 700; }
        .conversion-note { font-size: 11px; color: var(--text-light); margin-top: 4px; font-family: var(--font-mono); }
        .item-total { font-family: var(--font-mono); font-size: 13px; color: var(--text-secondary); font-weight: 700; }
        
        .grand-total { background: var(--accent-dim); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: var(--radius); padding: 16px; display: flex; justify-content: space-between; align-items: center; }
        .grand-label { font-family: var(--font-display); font-size: 14px; font-weight: 800; color: var(--text-primary); }
        .grand-value { font-family: var(--font-mono); font-size: 18px; font-weight: 800; color: var(--text-secondary); }

        .empty-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px; text-align: center; }
        .empty-icon-sm { color: var(--text-light); margin-bottom: 16px; }
        .empty-title-sm { font-family: var(--font-display); font-size: 16px; color: var(--text-primary); margin-bottom: 6px; font-weight: 700; }
        
        .empty { text-align: center; padding: 64px 32px; color: var(--text-muted); }
        .empty-title { font-family: var(--font-display); font-size: 18px; color: var(--text-primary); margin-bottom: 8px; font-weight: 700; }
      `}</style>

      <h1 className="page-heading">My Quotations & Orders</h1>
      <p className="page-sub">Track the status of your submitted chemical quotations</p>

      {loading && quotations.length === 0 ? (
        <div className="glass-panel empty">
          <div className="empty-title">Loading your quotations...</div>
        </div>
      ) : error ? (
        <div className="glass-panel empty" style={{ color: "#ef4444" }}>
          <div className="empty-title">Error loading quotations</div>
          <div>{error}</div>
        </div>
      ) : quotations.length === 0 ? (
        <div className="glass-panel empty">
          <div className="empty-title">No quotations placed yet</div>
          <div style={{ color: "var(--text-muted)", marginTop: 4 }}>Submit a quotation in the "New Quotation" tab</div>
        </div>
      ) : (
        <>
          <div className="filter-tabs">
            {(["all", "pending", "approved", "rejected", "fulfilled"] as const).map((s) => (
              <button key={s} className={`filter-tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
                {s === "all"
                  ? `All (${quotations.length})`
                  : `${STATUS_CONFIG[s]?.label ?? s} (${quotations.filter((q) => q.status === s).length})`}
              </button>
            ))}
          </div>

          <div className="layout">
            <div className="quotation-list">
              {filtered.length === 0 ? (
                <div className="empty-state-list">
                  No quotations found matching filter
                </div>
              ) : (
                filtered.map((q) => {
                  const sc = STATUS_CONFIG[q.status];
                  const dateStr = new Date(q.createdAt).toLocaleString("en-IN", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  });
                  const isSelected = selected?.id === q.id;

                  return (
                    <div
                      key={q.id}
                      className={`quotation-card ${isSelected ? "active" : ""}`}
                      onClick={() => setSelected(q)}
                    >
                      <div className="card-header-row">
                        <span className="qt-id">{q.id.substring(0, 8)}</span>
                        <span
                          className="status-badge"
                          style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <div className="card-body-row">
                        <div className="card-date" style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          Items: <strong style={{ color: "var(--text-primary)" }}>{q.items?.length || 0}</strong>
                        </div>
                      </div>
                      <div className="card-footer-row">
                        <span className="card-date">{dateStr}</span>
                        <span className="card-total-val">{formatINR(q.total)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="glass-panel detail-panel">
              {selected ? (
                <>
                  <div className="detail-header">
                    <div className="detail-title">Quotation details ({selected.id.substring(0, 8)})</div>
                    <div className="detail-meta">
                      Submitted: {new Date(selected.createdAt).toLocaleString("en-IN")}
                    </div>
                    {selected.notes && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", borderLeft: "3px solid var(--text-secondary)", paddingLeft: 8 }}>
                        "{selected.notes}"
                      </div>
                    )}
                  </div>
                  <div className="detail-body">
                    <div>
                      <div className="detail-section-label">Ordered Items</div>
                      {selected.items.map((item, i) => (
                        <div key={i} className="item-row">
                          <div className="item-name">{item.productName}</div>
                          <div className="item-sku">{item.sku}</div>
                          <div className="item-qty-row">
                            <div>
                              <div className="item-qty">
                                Ordered: <span>{parseNum(item.orderedQty).toLocaleString()} {item.orderedUnit}</span>
                              </div>
                              {item.orderedUnit !== item.baseUnit && (
                                <div className="conversion-note">
                                  → {parseNum(item.baseQty).toLocaleString()} {item.baseUnit} (stored)
                                </div>
                              )}
                              <div className="item-qty" style={{ marginTop: 2 }}>
                                Rate: <span>{formatINR(item.basePrice)}/{item.baseUnit}</span>
                              </div>
                            </div>
                            <div className="item-total">{formatINR(item.lineTotal)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grand-total">
                      <span className="grand-label">Grand Total</span>
                      <span className="grand-value">{formatINR(selected.total)}</span>
                    </div>

                    <div style={{ marginTop: 12, background: "rgba(255, 255, 255, 0.35)", padding: 16, borderRadius: "var(--radius)", fontSize: 13, border: `1px solid ${STATUS_CONFIG[selected.status].border}` }}>
                      Status: <strong style={{ color: STATUS_CONFIG[selected.status].color, textTransform: "uppercase" }}>{STATUS_CONFIG[selected.status].label}</strong>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>
                        {selected.status === "pending" && "Waiting for Admin approval."}
                        {selected.status === "approved" && "Approved! Preparing package for shipment."}
                        {selected.status === "fulfilled" && "Order completed and stock dispatched."}
                        {selected.status === "rejected" && "This quotation request was declined."}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-panel">
                  <div className="empty-icon-sm">
                    <ClipboardIcon size={36} />
                  </div>
                  <div className="empty-title-sm">Select a quotation</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Click any row to view details</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
