// ===== LAYOUT =====
// Styled with Inficy Universal Product Design Standard & Theme Toggle

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Laptop, ShieldCheck, Sparkles } from 'lucide-react';
import { useTheme } from '@/utils/theme';

// ===== HEADER =====
export const Header: React.FC = () => {
  const location = useLocation();
  const { theme, cycleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { to: '/', label: 'Home', active: location.pathname === '/' },
    { to: '/convert/jpg-to-png', label: 'Convert', active: location.pathname.startsWith('/convert') && !location.pathname.includes('pdf') },
    { to: '/compress/image', label: 'Compress', active: location.pathname.startsWith('/compress') },
    { to: '/resize/image', label: 'Resize', active: location.pathname.startsWith('/resize') },
    { to: '/convert/image-to-pdf', label: 'PDF', active: location.pathname.includes('pdf') },
    { to: '/about', label: 'About', active: location.pathname === '/about' },
  ];

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-sub)',
        transition: 'background-color var(--transition-base), border-color var(--transition-base)',
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '58px',
          gap: '12px',
        }}>
          {/* Left: Brand Identity */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <img
              src="/INFINI CONVERTER.png"
              alt="Infini-Convert Logo"
              style={{
                width: 34,
                height: 34,
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
              }}
            />
            <div>
              <span style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                lineHeight: 1,
              }}>
                LoopHora
              </span>
              <span style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}>
                Infini-Convert
              </span>
            </div>
          </Link>

          {/* Center: Privacy Status Pill (hidden on tablet/mobile via CSS) */}
          <div className="badge badge-protection header-center-badge" style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'default',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--badge-green-text)',
              display: 'inline-block',
            }} />
            <span>Local Engine Active</span>
          </div>

          {/* Right: Navigation & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Desktop nav (hidden on mobile via CSS) */}
            <nav className="desktop-nav">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} label={link.label} active={link.active} />
              ))}
            </nav>

            <div className="hide-mobile" style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-sub)', margin: '0 4px' }} />

            {/* Theme Toggle Button */}
            <button
              onClick={cycleTheme}
              className="btn-icon"
              title={`Theme: ${theme.toUpperCase()} (Click to cycle Light / Dark / System)`}
              aria-label="Toggle color theme"
            >
              <ThemeIcon style={{ width: '15px', height: '15px' }} />
            </button>

            {/* Hamburger button (mobile only, shown via CSS) */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <div className={`mobile-nav-overlay ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => setMobileMenuOpen(false)}>
            <img src="/INFINI CONVERTER.png" alt="Infini-Convert" style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Infini-Convert</span>
          </Link>
          <button
            className="btn-icon"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="mobile-nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`mobile-nav-link ${link.active ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/privacy"
            className={`mobile-nav-link ${location.pathname === '/privacy' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Privacy
          </Link>
        </div>
        <div className="mobile-nav-footer">
          <div className="badge badge-protection" style={{ fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}>
            <ShieldCheck style={{ width: 14, height: 14 }} />
            <span>Local Engine · Zero Uploads</span>
          </div>
          <button
            onClick={() => { cycleTheme(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              marginTop: '12px',
              padding: '12px',
              background: 'none',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-sub)',
              cursor: 'pointer',
            }}
          >
            <ThemeIcon style={{ width: 16, height: 16 }} />
            <span style={{ textTransform: 'capitalize' }}>{theme} Mode</span>
          </button>
        </div>
      </div>
    </>
  );
};

const NavLink: React.FC<{ to: string; label: string; active: boolean }> = ({ to, label, active }) => (
  <Link
    to={to}
    style={{
      padding: '6px 12px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.8125rem',
      fontWeight: active ? 600 : 500,
      color: active ? 'var(--text-main)' : 'var(--text-sub)',
      backgroundColor: active ? 'var(--bg-nav-active)' : 'transparent',
      textDecoration: 'none',
      transition: 'all var(--transition-fast)',
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.backgroundColor = 'var(--bg-nav-hover)';
        e.currentTarget.style.color = 'var(--text-main)';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--text-sub)';
      }
    }}
  >
    {label}
  </Link>
);

// ===== FOOTER =====
export const Footer: React.FC = () => {
  const { theme, cycleTheme } = useTheme();
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;

  return (
    <footer style={{
      marginTop: 'auto',
      borderTop: '1px solid var(--border-sub)',
      backgroundColor: 'var(--bg-header)',
      padding: '28px 0',
      transition: 'background-color var(--transition-base), border-color var(--transition-base)',
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/INFINI CONVERTER.png"
              alt="Infini-Convert"
              style={{
                width: 28,
                height: 28,
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
              }}
            />
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Infini-Convert by LoopHora
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Convert. Compress. Done. — Free, privacy-first, zero cloud storage.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link to="/privacy" style={{ fontSize: '0.8125rem', color: 'var(--text-sub)', textDecoration: 'none' }}>
              Privacy
            </Link>
            <Link to="/about" style={{ fontSize: '0.8125rem', color: 'var(--text-sub)', textDecoration: 'none' }}>
              About
            </Link>
            <button
              onClick={cycleTheme}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                fontSize: '0.8125rem',
                color: 'var(--text-sub)',
                cursor: 'pointer',
              }}
            >
              <ThemeIcon style={{ width: '14px', height: '14px' }} />
              <span style={{ textTransform: 'capitalize' }}>{theme} mode</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="badge badge-protection" style={{ fontSize: '0.6875rem' }}>
            <ShieldCheck style={{ width: '13px', height: '13px' }} />
            Zero Server Uploads — Processed 100% on device
          </div>
        </div>
      </div>
    </footer>
  );
};

// ===== PAGE WRAPPER =====
export const PageWrapper: React.FC<{
  children: React.ReactNode;
  title?: string;
  description?: string;
}> = ({ children, title, description }) => {
  React.useEffect(() => {
    if (title) {
      document.title = `${title} — Infini-Convert`;
    }
    return () => {
      document.title = 'Infini-Convert — Convert. Compress. Done.';
    };
  }, [title]);

  React.useEffect(() => {
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', description);
    }
  }, [description]);

  return (
    <main style={{ flex: 1, padding: '36px 0 64px' }}>
      <div className="container">
        {children}
      </div>
    </main>
  );
};
