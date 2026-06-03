"use client";

import { useState, useEffect } from "react";
import { ClipboardIcon, SearchIcon, FileTextIcon, RefreshIcon } from "@/components/Icons";

type Status = "approved" | "fulfilled";

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
  status: string;
  items: QuotationItem[];
  total: any;
  notes: string;
}

interface HistoryLog {
  id: string;
  productId: string;
  product: {
    name: string;
    sku: string;
  };
  changeQty: any;
  newQty: any;
  note: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  approved: { label: "Ready to Dispatch", color: "#10b981", bg: "rgba(16, 185, 129, 0.06)", border: "rgba(16, 185, 129, 0.15)" },
  fulfilled: { label: "Dispatched", color: "var(--text-secondary)", bg: "var(--accent-dim)", border: "rgba(99, 102, 241, 0.15)" },
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Quotation[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // 1. Fetch orders (all quotations that are approved or fulfilled)
      const resOrders = await fetch("/api/quotations");
      if (!resOrders.ok) throw new Error("Failed to load orders");
      const dataOrders = await resOrders.json();
      
      const filteredOrders = dataOrders.filter(
        (q: Quotation) => q.status === "approved" || q.status === "fulfilled"
      );
      setOrders(filteredOrders);

      // Restore selection if exists
      if (selected) {
        const updatedSelected = filteredOrders.find((q: Quotation) => q.id === selected.id);
        if (updatedSelected) setSelected(updatedSelected);
      }

      // 2. Fetch inventory dispatch logs
      const resHistory = await fetch("/api/inventory/history");
      if (resHistory.ok) {
        const dataHistory = await resHistory.json();
        setHistory(dataHistory);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDispatch = async (id: string) => {
    try {
      setActionError("");
      setActionLoading(true);
      const res = await fetch(`/api/quotations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "fulfilled" }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to dispatch order");
      }

      await fetchData();
    } catch (err: any) {
      setActionError(err.message || "Failed to dispatch order");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.sellerEmail.toLowerCase().includes(search.toLowerCase()) ||
      o.sellerName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ maxWidth: 1200 }} className="animate-fade-in">
      <style jsx>{`
        .page-heading-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
        .page-heading { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.6px; }
        .page-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 32px; }
        
        .filter-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
        .search-box { flex: 1; min-width: 260px; position: relative; }
        .search-icon-wrapper { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; color: var(--text-muted); }
        .input { width: 100%; background: rgba(255, 255, 255, 0.4); border: 1px solid rgba(0, 0, 0, 0.06); border-radius: var(--radius); padding: 10px 14px 10px 42px; color: var(--text-primary); font-family: var(--font-body); font-size: 14px; outline: none; transition: all 0.15s; box-shadow: 0 2px 10px rgba(0,0,0,0.01); }
        .input:focus { border-color: var(--text-secondary); background: rgba(255, 255, 255, 0.8); }
        
        .filter-tabs { display: flex; gap: 8px; }
        .filter-tab { padding: 8px 18px; border-radius: 20px; font-family: var(--font-display); font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid rgba(0,0,0,0.06); background: rgba(255,255,255,0.4); color: var(--text-primary); transition: all 0.15s; }
        .filter-tab.active { background: #ffffff; color: var(--text-primary); border-color: rgba(255,255,255,0.6); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .filter-tab:hover:not(.active) { background: rgba(255,255,255,0.6); }
        
        .action-error-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-radius: var(--radius-md);
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
        }
        .action-error-close {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 18px;
          cursor: pointer;
          padding: 0 4px;
          font-weight: bold;
          line-height: 1;
        }

        .layout { display: grid; grid-template-columns: 1fr 440px; gap: 24px; align-items: start; }
        
        .quotation-list { display: flex; flex-direction: column; gap: 14px; }
        .quotation-card { background: rgba(255, 255, 255, 0.45); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 20px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: var(--glass-shadow); }
        .quotation-card:hover { background: rgba(255, 255, 255, 0.75); border-color: rgba(255, 255, 255, 0.8); transform: translateY(-1px); }
        .quotation-card.active { background: #ffffff; border-color: rgba(255, 255, 255, 0.95); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04); }
        
        .card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .qt-id { font-family: var(--font-mono); font-size: 13px; color: var(--text-secondary); font-weight: 700; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; border: 1px solid; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .card-body-row { margin-bottom: 12px; }
        .seller-name { font-weight: 700; color: var(--text-primary); font-size: 14px; }
        .seller-email { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        
        .card-footer-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(0, 0, 0, 0.03); padding-top: 12px; }
        .card-date { font-family: var(--font-mono); font-size: 11px; color: var(--text-light); }
        .card-total-val { font-family: var(--font-mono); font-size: 16px; font-weight: 800; color: var(--text-secondary); }

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

        .btn-dispatch { background: #10b981; color: #ffffff; border: none; padding: 12px; border-radius: var(--radius); font-family: var(--font-display); font-size: 13px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; transition: all 0.15s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15); }
        .btn-dispatch:hover:not(:disabled) { background: #059669; transform: translateY(-1px); }
        .btn-dispatch:disabled { opacity: 0.6; cursor: not-allowed; }

        .dispatch-success-box { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 14px; borderRadius: var(--radius); color: #047857; font-size: 13px; font-weight: 700; text-align: center; }

        .empty { text-align: center; padding: 64px 32px; color: var(--text-muted); }
        .empty-title { font-family: var(--font-display); font-size: 18px; color: var(--text-primary); margin-bottom: 6px; font-weight: 700; }
        .empty-state-list { padding: 48px; text-align: center; color: var(--text-light); background: rgba(255, 255, 255, 0.25); border-radius: var(--radius-lg); border: 1px dashed rgba(0, 0, 0, 0.06); }
        .empty-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px; text-align: center; }
        .empty-icon-sm { color: var(--text-light); margin-bottom: 16px; }
        .empty-title-sm { font-family: var(--font-display); font-size: 16px; color: var(--text-primary); margin-bottom: 6px; font-weight: 700; }

        /* Logs table section */
        .logs-section { margin-top: 48px; }
        .logs-title { font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 16px; }
        .log-change { font-family: var(--font-mono); font-size: 13px; font-weight: 700; }
        .change-neg { color: #ef4444; }
        .change-pos { color: #10b981; }
        .log-qty { font-family: var(--font-mono); font-size: 13px; color: var(--text-primary); }
        
        .refresh-btn { display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(0,0,0,0.06); border-radius: 20px; padding: 6px 14px; font-size: 12px; font-family: var(--font-display); font-weight: 700; cursor: pointer; color: var(--text-primary); transition: all 0.15s; }
        .refresh-btn:hover { background: #ffffff; border-color: rgba(0,0,0,0.12); }
      `}</style>

      <div className="page-heading-row">
        <div>
          <h1 className="page-heading">Order Dispatch Portal</h1>
          <p className="page-sub">Confirm shipments, track dispatches, and audit transaction histories</p>
        </div>
        <button className="refresh-btn" onClick={fetchData} disabled={loading}>
          <RefreshIcon size={14} className={loading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {actionError && (
        <div className="action-error-banner">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")} className="action-error-close">×</button>
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div className="glass-panel empty">
          <div className="empty-title">Loading orders and dispatches...</div>
        </div>
      ) : error ? (
        <div className="glass-panel empty" style={{ color: "#ef4444" }}>
          <div className="empty-title">Error loading orders</div>
          <div>{error}</div>
        </div>
      ) : (
        <>
          <div className="filter-row">
            <div className="search-box">
              <span className="search-icon-wrapper">
                <SearchIcon size={16} />
              </span>
              <input
                className="input"
                placeholder="Search orders, seller email, or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-tabs">
              {(["all", "approved", "fulfilled"] as const).map((s) => (
                <button
                  key={s}
                  className={`filter-tab ${filter === s ? "active" : ""}`}
                  onClick={() => setFilter(s)}
                >
                  {s === "all"
                    ? `All Orders (${orders.length})`
                    : s === "approved"
                    ? `Ready to Dispatch (${orders.filter((o) => o.status === "approved").length})`
                    : `Dispatched (${orders.filter((o) => o.status === "fulfilled").length})`}
                </button>
              ))}
            </div>
          </div>

          <div className="layout">
            <div className="quotation-list">
              {filtered.length === 0 ? (
                <div className="empty-state-list">
                  No orders found matching the criteria
                </div>
              ) : (
                filtered.map((o) => {
                  const sc = STATUS_CONFIG[o.status as Status] || STATUS_CONFIG.approved;
                  const dateStr = new Date(o.createdAt).toLocaleString("en-IN", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  });
                  const isSelected = selected?.id === o.id;

                  return (
                    <div
                      key={o.id}
                      className={`quotation-card ${isSelected ? "active" : ""}`}
                      onClick={() => setSelected(o)}
                    >
                      <div className="card-header-row">
                        <span className="qt-id">{o.id.substring(0, 8)}</span>
                        <span
                          className="status-badge"
                          style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <div className="card-body-row">
                        <div className="seller-name">{o.sellerName}</div>
                        <div className="seller-email">{o.sellerEmail}</div>
                      </div>
                      <div className="card-footer-row">
                        <span className="card-date">{dateStr}</span>
                        <span className="card-total-val">{formatINR(o.total)}</span>
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
                    <div className="detail-title">Dispatch Invoice ({selected.id.substring(0, 8)})</div>
                    <div className="detail-meta">
                      Seller: <strong>{selected.sellerName}</strong> ({selected.sellerEmail})
                    </div>
                    <div className="detail-meta" style={{ marginTop: 2 }}>
                      Placed: {new Date(selected.createdAt).toLocaleString("en-IN")}
                    </div>
                    {selected.notes && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", borderLeft: "3px solid var(--text-secondary)", paddingLeft: 8 }}>
                        "{selected.notes}"
                      </div>
                    )}
                  </div>
                  
                  <div className="detail-body">
                    <div>
                      <div className="detail-section-label">Shipment Details</div>
                      {selected.items.map((item, i) => (
                        <div key={i} className="item-row">
                          <div className="item-name">{item.productName}</div>
                          <div className="item-sku">{item.sku}</div>
                          <div className="item-qty-row">
                            <div>
                              <div className="item-qty">
                                Ordered qty: <span>{parseNum(item.orderedQty).toLocaleString()} {item.orderedUnit}</span>
                              </div>
                              {item.orderedUnit !== item.baseUnit && (
                                <div className="conversion-note">
                                  → Converted: {parseNum(item.baseQty).toLocaleString()} {item.baseUnit} (shipped)
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
                      <span className="grand-label">Invoice Value</span>
                      <span className="grand-value">{formatINR(selected.total)}</span>
                    </div>

                    {selected.status === "approved" ? (
                      <button
                        className="btn-dispatch"
                        onClick={() => handleDispatch(selected.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Dispatching..." : "Confirm Dispatch"}
                      </button>
                    ) : (
                      <div className="dispatch-success-box">
                        ✓ Dispatched
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-panel">
                  <div className="empty-icon-sm">
                    <FileTextIcon size={36} />
                  </div>
                  <div className="empty-title-sm">No order selected</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Click any order card to verify details and ship</div>
                </div>
              )}
            </div>
          </div>

          {/* Audit Logs Section */}
          <div className="logs-section">
            <h2 className="logs-title">Physical Stock Dispatch History</h2>
            <div className="glass-panel table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Product Name (SKU)</th>
                    <th>Stock Adjustment</th>
                    <th>New stock level</th>
                    <th>Audit Note / ID</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--text-light)" }}>
                        No physical stock changes recorded yet.
                      </td>
                    </tr>
                  ) : (
                    history.map((log) => {
                      const dateStr = new Date(log.createdAt).toLocaleString("en-IN");
                      const val = parseNum(log.changeQty);
                      const isNeg = val < 0;

                      return (
                        <tr key={log.id}>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{dateStr}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{log.product?.name || "Deleted Product"}</div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{log.product?.sku}</div>
                          </td>
                          <td>
                            <span className={`log-change ${isNeg ? "change-neg" : "change-pos"}`}>
                              {isNeg ? "" : "+"}{val.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span className="log-qty">{parseNum(log.newQty).toLocaleString()}</span>
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{log.note}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
