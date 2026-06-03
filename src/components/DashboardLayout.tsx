"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import {
  FlaskIcon,
  BoxIcon,
  ClipboardIcon,
  FileTextIcon,
  SearchIcon,
  RefreshIcon,
  PlusIcon
} from "@/components/Icons";

const adminNav = [
  { href: "/admin/products", label: "Products", icon: FlaskIcon },
  { href: "/admin/inventory", label: "Inventory", icon: BoxIcon },
  { href: "/admin/orders", label: "Orders", icon: ClipboardIcon },
  { href: "/admin/quotations", label: "Quotations", icon: FileTextIcon },
];

const sellerNav = [
  { href: "/seller/browse", label: "Browse Catalog", icon: SearchIcon },
  { href: "/seller/quotation", label: "New Quotation", icon: PlusIcon },
  { href: "/seller/orders", label: "My Orders", icon: ClipboardIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const [switching, setSwitching] = useState(false);

  const role = (user?.publicMetadata?.role as string) ?? "seller";
  const nav = role === "admin" ? adminNav : sellerNav;
  const roleLabel = role === "admin" ? "Admin" : "Seller";

  const handleToggleRole = async () => {
    setSwitching(true);
    const newRole = role === "admin" ? "seller" : "admin";
    try {
      const res = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        window.location.href = newRole === "admin" ? "/admin/products" : "/seller/browse";
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar" style={{ width: collapsed ? "76px" : "260px" }}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <FlaskIcon size={18} style={{ color: "#fff" }} />
          </div>
          <div className="sidebar-brand" style={{ opacity: collapsed ? 0 : 1 }}>
            <div className="sidebar-name">AasaMedChem</div>
            <div className="sidebar-role">{roleLabel} Portal</div>
          </div>
        </div>

        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle Sidebar"
          data-collapsed={collapsed}
        >
          {collapsed ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          )}
        </button>

        <nav className="sidebar-nav">
          <div className="nav-label" style={{ opacity: collapsed ? 0 : 1 }}>Navigation</div>
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon" style={{ color: isActive ? "var(--text-secondary)" : "inherit" }}>
                  <Icon size={18} />
                </span>
                <span className="nav-text" style={{ opacity: collapsed ? 0 : 1 }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <UserButton afterSignOutUrl="/sign-in" />
          <div className="user-info" style={{ opacity: collapsed ? 0 : 1 }}>
            <div className="user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="user-role">{user?.primaryEmailAddress?.emailAddress}</div>
          </div>
        </div>
      </aside>

      <main className="main" style={{ marginLeft: collapsed ? "76px" : "260px" }}>
        <div className="topbar">
          <span className="page-title">
            {nav.find((n) => pathname.startsWith(n.href))?.label ?? "Dashboard"}
          </span>
          <div className="topbar-right">
            <button
              className="btn-switch-role"
              onClick={handleToggleRole}
              disabled={switching}
            >
              <RefreshIcon size={13} style={{ color: "var(--text-secondary)" }} />
              {switching ? "Switching..." : `Switch to ${role === "admin" ? "Seller" : "Admin"}`}
            </button>
            <span className={`role-badge ${role}`}>{roleLabel}</span>
          </div>
        </div>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
