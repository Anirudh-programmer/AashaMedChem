"use client";

import { useState, useEffect } from "react";
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, FlaskIcon } from "@/components/Icons";

const UNITS = ["g", "kg", "mL", "L", "unit"] as const;
type Unit = (typeof UNITS)[number];

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  baseUnit: Unit;
  basePrice: any;
  stock: any;
  lowStockThreshold: any;
  status: "active" | "inactive";
}

const CATEGORIES = ["All", "Salts", "Solvents", "Acids", "Adsorbents", "Sugars", "Equipment", "Bases", "Buffers", "Other"];

const UNIT_LABELS: Record<Unit, string> = {
  g: "grams (g)",
  kg: "kilograms (kg)",
  mL: "milliliters (mL)",
  L: "liters (L)",
  unit: "items (unit)",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  const [form, setForm] = useState<Omit<Product, "id">>({
    name: "",
    sku: "",
    category: "Salts",
    description: "",
    baseUnit: "g",
    basePrice: 0,
    stock: 0,
    lowStockThreshold: 0,
    status: "active",
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load products from server");
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCat = category === "All" || p.category === category;
    return matchSearch && matchCat;
  });

  const openCreate = () => {
    setEditProduct(null);
    setForm({
      name: "",
      sku: "",
      category: "Salts",
      description: "",
      baseUnit: "g",
      basePrice: 0,
      stock: 0,
      lowStockThreshold: 0,
      status: "active",
    });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      description: p.description,
      baseUnit: p.baseUnit,
      basePrice: typeof p.basePrice === "string" ? parseFloat(p.basePrice) : p.basePrice,
      stock: typeof p.stock === "string" ? parseFloat(p.stock) : p.stock,
      lowStockThreshold: typeof p.lowStockThreshold === "string" ? parseFloat(p.lowStockThreshold) : p.lowStockThreshold,
      status: p.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const url = editProduct ? `/api/products/${editProduct.id}` : "/api/products";
      const method = editProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save product");
      }

      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to save product");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete product");
      }
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
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

  return (
    <div className="products-page animate-fade-in">
      <style jsx>{`
        .products-page {
          max-width: 1200px;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
          gap: 16px;
        }

        .page-heading {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.6px;
        }

        .page-sub {
          font-size: 14px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          padding: 24px;
        }

        .stat-label {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .stat-value {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -1px;
          line-height: 1.1;
        }

        .stat-sub {
          font-size: 12px;
          color: var(--text-light);
          margin-top: 6px;
        }

        .filters {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-box {
          flex: 1;
          min-width: 280px;
          position: relative;
        }

        .search-icon-wrapper {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          color: var(--text-muted);
        }

        .input {
          width: 100%;
          background: rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius);
          padding: 10px 14px 10px 42px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          outline: none;
          transition: all 0.15s;
          box-shadow: 0 2px 10px rgba(0,0,0,0.01);
        }

        .input:focus {
          border-color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.8);
        }
        .input::placeholder {
          color: var(--text-light);
        }

        .input-plain {
          width: 100%;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius);
          padding: 10px 14px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          outline: none;
          transition: all 0.15s;
        }

        .input-plain:focus {
          border-color: var(--text-secondary);
          background: #ffffff;
        }

        .select {
          background: rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius);
          padding: 10px 36px 10px 14px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%231e1b4b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          transition: all 0.15s;
          box-shadow: 0 2px 10px rgba(0,0,0,0.01);
        }

        .select:focus {
          border-color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.8);
        }

        .btn {
          padding: 10px 22px;
          border-radius: 20px;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .btn-primary {
          background: #1e1b4b; /* Solid Dark Slate like CV download */
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(30, 27, 75, 0.15);
        }

        .btn-primary:hover {
          background: #0f0d2b;
          transform: translateY(-1px);
        }

        .btn-ghost {
          background: rgba(255, 255, 255, 0.5);
          color: var(--text-primary);
          border-color: rgba(0, 0, 0, 0.08);
        }

        .btn-ghost:hover {
          background: rgba(255, 255, 255, 0.8);
          border-color: rgba(0, 0, 0, 0.2);
        }

        .btn-danger {
          background: rgba(239, 68, 68, 0.06);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.15);
        }

        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .btn-sm {
          padding: 6px 14px;
          font-size: 12px;
          border-radius: 14px;
        }


        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .card { padding: 24px; display: flex; flex-direction: column; justify-content: space-between; min-height: 250px; }
        .inactive-card { opacity: 0.75; }
        
        .card-top { display: flex; flex-direction: column; gap: 8px; }
        .card-meta { display: flex; justify-content: space-between; align-items: center; }
        .sku { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
        .cat { font-size: 11px; font-weight: 700; padding: 4px 10px; background: var(--accent-dim); color: var(--text-secondary); border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.1); }
        
        .status-badge-inline { font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 10px; }
        .status-badge-inline.active { background: rgba(16, 185, 129, 0.08); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .status-badge-inline.inactive { background: rgba(0, 0, 0, 0.05); color: var(--text-muted); border: 1px solid rgba(0, 0, 0, 0.1); }
        
        .name { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--text-primary); margin-top: 4px; }
        .desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-top: 6px; }
        
        .card-bottom { border-top: 1px solid rgba(0, 0, 0, 0.04); padding-top: 16px; margin-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
        .price-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 800; }
        .price-val { font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
        .stock-label { font-size: 11px; color: var(--text-muted); text-align: right; font-weight: 800; }
        .stock-val { font-family: var(--font-mono); font-size: 14px; font-weight: 700; }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(30, 27, 75, 0.15);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fadeIn 0.15s ease;
        }

        .modal {
          width: 100%;
          max-width: 580px;
          overflow: hidden;
          animation: fadeIn 0.2s ease;
        }

        .modal-header {
          padding: 24px 28px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.35);
        }

        .modal-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .modal-close {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid rgba(0, 0, 0, 0.08);
          cursor: pointer;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.15s;
        }

        .modal-close:hover {
          background: #ffffff;
        }

        .modal-body {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .modal-footer {
          padding: 20px 28px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: rgba(255, 255, 255, 0.35);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-label {
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .hint {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .empty {
          text-align: center;
          padding: 64px 32px;
          color: var(--text-muted);
        }

        .empty-icon {
          display: flex;
          justify-content: center;
          color: var(--text-light);
          margin-bottom: 16px;
        }
        .empty-title {
          font-family: var(--font-display);
          font-size: 18px;
          color: var(--text-primary);
          margin-bottom: 8px;
          font-weight: 700;
        }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-heading">Products</h1>
          <p className="page-sub">
            {products.length} products · {products.filter((p) => p.status === "active").length} active
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <PlusIcon size={14} /> New Product
        </button>
      </div>

      {/* Loading or Error states */}
      {loading ? (
        <div className="glass-panel empty">
          <div className="empty-title">Loading chemical products...</div>
        </div>
      ) : error ? (
        <div className="glass-panel empty" style={{ color: "#ef4444" }}>
          <div className="empty-title">Error loading products</div>
          <div>{error}</div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-row">
            {[
              { label: "Total Products", value: products.length, sub: "across all categories" },
              { label: "Active", value: products.filter((p) => p.status === "active").length, sub: "available for order" },
              {
                label: "Low Stock",
                value: products.filter((p) => parseNum(p.stock) <= parseNum(p.lowStockThreshold)).length,
                sub: "need restocking",
              },
              { label: "Categories", value: new Set(products.map((p) => p.category)).size, sub: "product types" },
            ].map((s, i) => (
              <div className={`glass-panel glass-panel-hover stat-card stagger-${i + 1} animate-fade-in`} key={s.label}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="filters">
            <div className="search-box">
              <span className="search-icon-wrapper">
                <SearchIcon size={16} />
              </span>
              <input
                className="input"
                placeholder="Search products or SKU…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="glass-panel empty">
              <div className="empty-icon">
                <FlaskIcon size={36} />
              </div>
              <div className="empty-title">No chemicals found</div>
              <div>Try adjusting your filters or search keywords</div>
            </div>
          ) : (
            <div className="grid">
              {filtered.map((p, i) => {
                const isLowStock = parseNum(p.stock) <= parseNum(p.lowStockThreshold);
                const isInactive = p.status === "inactive";
                return (
                  <div key={p.id} className={`glass-panel glass-panel-hover card stagger-${(i % 6) + 1} animate-fade-in ${isInactive ? "inactive-card" : ""}`}>
                    <div className="card-top">
                      <div className="card-meta">
                        <span className="sku">{p.sku}</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span className={`status-badge-inline ${p.status}`}>
                            {p.status}
                          </span>
                          <span className="cat">{p.category}</span>
                        </div>
                      </div>
                      <h3 className="name">{p.name}</h3>
                      {p.description && <p className="desc">{p.description}</p>}
                    </div>
                    <div>
                      <div className="card-bottom">
                        <div>
                          <div className="price-label">Base Price</div>
                          <div className="price-val">
                            {formatINR(p.basePrice)}
                            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-light)" }}>/{p.baseUnit}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="stock-label">Stock Level</div>
                          <div className="stock-val" style={{ color: isLowStock ? "#ef4444" : "var(--text-primary)" }}>
                            {parseNum(p.stock).toLocaleString("en-IN")} {p.baseUnit}
                            {isLowStock && (
                              <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 800, textTransform: "uppercase", marginTop: 2 }}>Low Stock</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="card-actions" style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => openEdit(p)}>
                          <EditIcon size={12} /> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setDeleteConfirm(p.id)}>
                          <TrashIcon size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="glass-panel modal">
            <div className="modal-header">
              <span className="modal-title">{editProduct ? "Edit Product" : "New Product"}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    className="input-plain"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Sodium Chloride"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input
                    className="input-plain"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    placeholder="e.g. NaCl-001"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="input-plain"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="input-plain"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  className="input-plain"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief product description"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Base Unit</label>
                  <select
                    className="input-plain"
                    value={form.baseUnit}
                    onChange={(e) => setForm((f) => ({ ...f, baseUnit: e.target.value as Unit }))}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {UNIT_LABELS[u]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Base Price (INR / {form.baseUnit})</label>
                  <input
                    className="input-plain"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={form.basePrice}
                    onChange={(e) => setForm((f) => ({ ...f, basePrice: parseFloat(e.target.value) || 0 }))}
                  />
                  <div className="hint">Price stored in INR with 6 decimal precision</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Initial Stock ({form.baseUnit})</label>
                  <input
                    className="input-plain"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Low Stock Threshold ({form.baseUnit})</label>
                  <input
                    className="input-plain"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!form.name || !form.sku || saveLoading}
              >
                {saveLoading ? "Saving..." : editProduct ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-panel modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Confirm Delete</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text-primary)", fontSize: 14, lineHeight: 1.6 }}>
                Are you sure you want to delete{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {products.find((p) => p.id === deleteConfirm)?.name}
                </strong>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm!)}>
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
