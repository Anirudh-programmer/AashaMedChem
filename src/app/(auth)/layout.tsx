"use client";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      <style jsx>{`
        .auth-layout {
          min-height: 100vh;
          display: flex;
          background: var(--bg-primary);
          position: relative;
          overflow: hidden;
          width: 100%;
        }

        .auth-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px;
          background: linear-gradient(135deg, #09090f 0%, #121224 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          overflow: hidden;
          
          --text-primary: #ffffff;
          --text-secondary: #cbd5e1;
          --accent: #4ade80;
          --accent-glow: rgba(74, 222, 128, 0.35);
          --border: rgba(255, 255, 255, 0.04);
        }

        .auth-left::before {
          content: "";
          position: absolute;
          top: -200px;
          left: -200px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(74, 222, 159, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .auth-left::after {
          content: "";
          position: absolute;
          bottom: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .brand {
          position: relative;
          z-index: 1;
          margin-bottom: 64px;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
        }

        .brand-icon {
          width: 44px;
          height: 44px;
          background: var(--accent);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: var(--shadow-accent);
        }

        .brand-name {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.3px;
        }

        .brand-tagline {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--accent);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: 42px;
          font-weight: 800;
          line-height: 1.1;
          color: var(--text-primary);
          margin-bottom: 20px;
          letter-spacing: -1px;
        }

        .hero-title span {
          color: var(--accent);
        }

        .hero-desc {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 380px;
          margin-bottom: 48px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .feature-dot {
          width: 8px;
          height: 8px;
          background: var(--accent);
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 8px var(--accent-glow);
        }

        .feature-text {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 48px 48px;
          opacity: 0.3;
          pointer-events: none;
        }

        .auth-right {
          width: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-left: 1px solid rgba(0, 0, 0, 0.04);
        }

        @media (max-width: 900px) {
          .auth-layout { flex-direction: column; }
          .auth-left { display: none; }
          .auth-right { width: 100%; flex: 1; }
        }
      `}</style>

      <div className="auth-left">
        <div className="grid-overlay" />
        <div className="brand">
          <div className="brand-logo">
            <div className="brand-icon">⚗️</div>
            <div className="brand-name">AasaMedChem</div>
          </div>
          <h1 className="hero-title">
            Precision<br />
            <span>Chemical</span><br />
            Commerce
          </h1>
          <p className="hero-desc">
            Manage pharmaceutical and chemical inventory with exact unit conversions, 
            real-time pricing in INR, and streamlined quotation workflows.
          </p>
        </div>
      </div>

      <div className="auth-right">
        {children}
      </div>
    </div>
  );
}
