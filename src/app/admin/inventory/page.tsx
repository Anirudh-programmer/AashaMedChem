"use client";

import { useState, useEffect } from "react";
import { BoxIcon } from "@/components/Icons";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  baseUnit: string;
  stock: number;
  lowStockThreshold: number;
  reserved: number;
  maxCapacity: number;
  status: string;
  updatedAt: string;
}

export default function AdminInventoryPage() {
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      setInventory(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjust = async () => {
    if (!adjustId || !adjustAmount) return;
    try {
      setAdjustLoading(true);
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: adjustId,
          adjustAmount: parseFloat(adjustAmount),
          note: adjustNote,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to adjust stock");
      }

      setAdjustId(null);
      setAdjustAmount("");
      setAdjustNote("");
      fetchInventory();
    } catch (err: any) {
      alert(err.message || "Failed to adjust stock");
    } finally {
      setAdjustLoading(false);
    }
  };

  const totalValue = inventory.reduce((sum, item) => sum + item.stock, 0);

  return (
    <div className="inventory-page animate-fade-in" style={{ maxWidth: 1320 }}>
      <style jsx>{`
        .page-heading { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.6px; margin-bottom: 4px; }
        .page-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 32px; }
        
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
        .stat-card { padding: 24px; }
        .stat-label { font-family: var(--font-display); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 8px; }
        .stat-value { font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--text-primary); letter-spacing: -1px; line-height: 1.1; }
        .stat-sub { font-size: 12px; color: var(--text-light); margin-top: 6px; }
        
        
        .product-name { font-weight: 700; color: var(--text-primary); font-size: 14px; }
        .product-sku { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        
        .stock-bar-wrap { display: flex; flex-direction: column; gap: 6px; min-width: 140px; }
        .stock-bar-label { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; }
        .stock-bar-bg { background: rgba(0, 0, 0, 0.06); border-radius: 4px; height: 6px; overflow: hidden; }
        .stock-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
        .stock-ok-fill { background: #10b981; }
        .stock-warn-fill { background: var(--accent-pink); }
        .stock-low-fill { background: #ef4444; }
        
        .mono { font-family: var(--font-mono); font-size: 13px; font-weight: 700; }
        
        .btn { padding: 8px 16px; border-radius: 20px; font-family: var(--font-display); font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid rgba(0, 0, 0, 0.08); background: rgba(255, 255, 255, 0.5); color: var(--text-primary); transition: all 0.15s; }
        .btn:hover { background: rgba(255, 255, 255, 0.8); border-color: rgba(0, 0, 0, 0.2); }
        .btn-accent { background: var(--accent-dim); color: var(--text-secondary); border-color: rgba(99, 102, 241, 0.15); }
        .btn-accent:hover { background: rgba(99, 102, 241, 0.12); }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(30, 27, 75, 0.15); backdrop-filter: blur(8px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .modal { width: 100%; max-width: 440px; overflow: hidden; animation: fadeIn 0.2s ease; }
        .modal-header { padding: 24px 28px; border-bottom: 1px solid rgba(0, 0, 0, 0.05); background: rgba(255, 255, 255, 0.35); }
        .modal-title { font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--text-primary); }
        .modal-body { padding: 28px; display: flex; flex-direction: column; gap: 18px; }
        .modal-footer { padding: 16px 28px; border-top: 1px solid rgba(0, 0, 0, 0.05); display: flex; justify-content: flex-end; gap: 12px; background: rgba(255, 255, 255, 0.35); }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-label { font-family: var(--font-display); font-size: 12px; font-weight: 800; color: var(--text-primary); }
        .input-plain { width: 100%; background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(0, 0, 0, 0.08); border-radius: var(--radius); padding: 10px 14px; color: var(--text-primary); font-family: var(--font-body); font-size: 14px; outline: none; transition: all 0.15s; }
        .input-plain:focus { border-color: var(--text-secondary); background: #ffffff; }
        .hint { font-size: 12px; color: var(--text-muted); }
        
        .empty { text-align: center; padding: 64px 32px; color: var(--text-muted); }
        .empty-title { font-family: var(--font-display); font-size: 18px; color: var(--text-primary); margin-bottom: 6px; font-weight: 700; }
        .empty-icon { display: flex; justify-content: center; color: var(--text-light); margin-bottom: 16px; }
      `}</style>

      <h1 className="page-heading">Inventory</h1>
      <p className="page-sub">Real-time stock levels and adjustment tools</p>

      {loading ? (
        <div className="glass-panel empty">
          <div className="empty-title">Loading chemical inventory...</div>
        </div>
      ) : error ? (
        <div className="glass-panel empty" style={{ color: "#ef4444" }}>
          <div className="empty-title">Error loading inventory</div>
          <div>{error}</div>
        </div>
      ) : (
        <>
          <div className="stats-row">
            <div className="glass-panel stat-card stagger-1 animate-fade-in">
              <div className="stat-label">Total SKUs</div>
              <div className="stat-value">{inventory.length}</div>
              <div className="stat-sub">tracked products</div>
            </div>
            <div className="glass-panel stat-card stagger-2 animate-fade-in">
              <div className="stat-label">Low Stock Alerts</div>
              <div className="stat-value" style={{ color: inventory.filter(i => i.stock <= i.lowStockThreshold).length > 0 ? "#ef4444" : "#10b981" }}>
                {inventory.filter(i => i.stock <= i.lowStockThreshold).length}
              </div>
              <div className="stat-sub">items need restocking</div>
            </div>
            <div className="glass-panel stat-card stagger-3 animate-fade-in">
              <div className="stat-label">Total Physical Stock</div>
              <div className="stat-value">
                {totalValue.toLocaleString("en-IN")}
              </div>
              <div className="stat-sub">aggregated base units</div>
            </div>
          </div>

          <div className="glass-panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Base Unit</th>
                  <th>Available Stock</th>
                  <th>Reserved (Pending)</th>
                  <th>Stock Level</th>
                  <th>Last Updated</th>
                  <th>Adjust</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const threshold = item.lowStockThreshold || 1;
                  const maxCap = item.maxCapacity || (threshold * 5);
                  const pct = Math.max(0, Math.min(100, (item.stock / maxCap) * 100));
                  const fillClass = item.stock <= threshold ? "stock-low-fill" : item.stock <= threshold * 2 ? "stock-warn-fill" : "stock-ok-fill";
                  const lastUpdateDate = new Date(item.updatedAt).toLocaleDateString("en-IN", {
                    year: "numeric", month: "short", day: "numeric"
                  });

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="product-name">{item.name}</div>
                        <div className="product-sku">{item.sku}</div>
                      </td>
                      <td>
                        <span className="unit-badge" style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "4px 10px", background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)", borderRadius: 6 }}>
                          {item.baseUnit}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ color: item.stock <= threshold ? "#ef4444" : "var(--text-primary)" }}>
                          {item.stock.toLocaleString("en-IN")} {item.baseUnit}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ color: item.reserved > 0 ? "var(--accent-pink)" : "var(--text-light)" }}>
                          {item.reserved.toLocaleString("en-IN")} {item.baseUnit}
                        </span>
                      </td>
                      <td>
                        <div className="stock-bar-wrap">
                          <div className="stock-bar-label">
                            <span style={{ color: item.stock <= threshold ? "#ef4444" : "var(--text-muted)" }}>
                              {item.stock <= threshold ? "Alert" : "Normal"}
                            </span>
                            <span style={{ color: "var(--text-light)" }}>{Math.round(pct)}%</span>
                          </div>
                          <div className="stock-bar-bg">
                            <div className={`stock-bar-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{lastUpdateDate}</span>
                      </td>
                      <td>
                        <button className="btn btn-accent btn-sm" onClick={() => { setAdjustId(item.id); setAdjustAmount(""); setAdjustNote(""); }}>
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {adjustId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAdjustId(null)}>
          <div className="glass-panel modal">
            <div className="modal-header">
              <div className="modal-title">Adjust Stock</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                {inventory.find(i => i.id === adjustId)?.name}
              </div>
            </div>
            <div className="modal-body">
              <div style={{ background: "rgba(255, 255, 255, 0.4)", borderRadius: "var(--radius)", padding: "14px 16px", fontSize: 14, color: "var(--text-primary)", border: "1px solid rgba(0, 0, 0, 0.05)", marginBottom: 4 }}>
                Current stock: <strong style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                  {inventory.find(i => i.id === adjustId)?.stock.toLocaleString("en-IN")} {inventory.find(i => i.id === adjustId)?.baseUnit}
                </strong>
              </div>
              <div className="form-group">
                <label className="form-label">Adjustment Amount</label>
                <input className="input-plain" type="number" step="0.000001" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="e.g. +500 or -200" />
                <div className="hint">Use positive to add stock, negative to reduce</div>
              </div>
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input className="input-plain" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="e.g. Restocked from supplier" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setAdjustId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: "#1e1b4b", color: "#fff", border: "none" }} onClick={handleAdjust} disabled={!adjustAmount || adjustLoading}>
                {adjustLoading ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
