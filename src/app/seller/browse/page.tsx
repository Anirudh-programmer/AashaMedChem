"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SearchIcon, FlaskIcon } from "@/components/Icons";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  baseUnit: string;
  basePrice: any;
  stock: any;
  status: string;
}

const CATEGORIES = ["All", "Salts", "Solvents", "Acids", "Adsorbents", "Sugars", "Equipment", "Bases", "Buffers", "Other"];

export default function SellerBrowsePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load product catalog");
      const data = await res.json();
      // Only show active products to sellers
      setProducts(data.filter((p: Product) => p.status === "active"));
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
    <div className="browse-page animate-fade-in" style={{ maxWidth: 1200 }}>
      <style jsx>{`
        .page-heading { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.6px; margin-bottom: 4px; }
        .page-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 32px; }
        
        .filters { display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; align-items: center; }
        .search-box { flex: 1; min-width: 280px; position: relative; }
        .search-icon-wrapper { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; color: var(--text-muted); }
        .input { width: 100%; background: rgba(255, 255, 255, 0.4); border: 1px solid rgba(0, 0, 0, 0.06); border-radius: var(--radius); padding: 10px 14px 10px 42px; color: var(--text-primary); font-family: var(--font-body); font-size: 14px; outline: none; transition: all 0.15s; box-shadow: 0 2px 10px rgba(0,0,0,0.01); }
        .input:focus { border-color: var(--text-secondary); background: rgba(255, 255, 255, 0.8); }
        .input::placeholder { color: var(--text-light); }
        
        .select { background: rgba(255, 255, 255, 0.4); border: 1px solid rgba(0, 0, 0, 0.06); border-radius: var(--radius); padding: 10px 36px 10px 14px; color: var(--text-primary); font-family: var(--font-body); font-size: 14px; outline: none; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%231e1b4b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; transition: all 0.15s; box-shadow: 0 2px 10px rgba(0,0,0,0.01); }
        .select:focus { border-color: var(--text-secondary); background: rgba(255, 255, 255, 0.8); }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .card { padding: 24px; display: flex; flex-direction: column; justify-content: space-between; min-height: 240px; }
        
        .card-top { display: flex; flex-direction: column; gap: 8px; }
        .card-meta { display: flex; justify-content: space-between; align-items: center; }
        .sku { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
        .cat { font-size: 11px; font-weight: 700; padding: 4px 10px; background: var(--accent-dim); color: var(--text-secondary); border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.1); }
        .name { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--text-primary); margin-top: 4px; }
        .desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-top: 6px; }
        
        .card-bottom { border-top: 1px solid rgba(0, 0, 0, 0.04); padding-top: 16px; margin-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
        .price-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 800; }
        .price-val { font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
        .stock-label { font-size: 11px; color: var(--text-muted); text-align: right; font-weight: 800; }
        .stock-val { font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--text-primary); margin-top: 4px; }
        
        .btn-quote { display: inline-flex; align-items: center; justify-content: center; background: #1e1b4b; color: #fff; padding: 10px 18px; border-radius: 20px; font-family: var(--font-display); font-size: 12px; font-weight: 700; text-decoration: none; margin-top: 16px; transition: all 0.15s; border: none; width: 100%; box-shadow: 0 4px 12px rgba(30, 27, 75, 0.15); cursor: pointer; }
        .btn-quote:hover { background: #0f0d2b; transform: translateY(-1px); }
        
        .empty { text-align: center; padding: 64px 32px; color: var(--text-muted); }
        .empty-title { font-family: var(--font-display); font-size: 18px; color: var(--text-primary); margin-bottom: 8px; font-weight: 700; }
        .empty-icon { display: flex; justify-content: center; color: var(--text-light); margin-bottom: 16px; }
      `}</style>

      <h1 className="page-heading">Chemical Catalog</h1>
      <p className="page-sub">Browse items and request quotations</p>

      {loading ? (
        <div className="glass-panel empty">
          <div className="empty-title">Loading catalog...</div>
        </div>
      ) : error ? (
        <div className="glass-panel empty" style={{ color: "#ef4444" }}>
          <div className="empty-title">Error loading catalog</div>
          <div>{error}</div>
        </div>
      ) : (
        <>
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
              {filtered.map((p, i) => (
                <div key={p.id} className={`glass-panel glass-panel-hover card stagger-${(i % 6) + 1} animate-fade-in`}>
                  <div className="card-top">
                    <div className="card-meta">
                      <span className="sku">{p.sku}</span>
                      <span className="cat">{p.category}</span>
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
                        <div className="stock-label">Availability</div>
                        <div className="stock-val">
                          {parseNum(p.stock) > 0 ? (
                            <span>{parseNum(p.stock).toLocaleString()} {p.baseUnit}</span>
                          ) : (
                            <span style={{ color: "#ef4444" }}>Out of stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link href={`/seller/quotation?sku=${p.sku}`} className="btn-quote">
                      Add to Quotation
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
