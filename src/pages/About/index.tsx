// ===== ABOUT PAGE =====
// Styled with Inficy Universal Product Design Standard

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, UserX, Cpu, ArrowRight } from 'lucide-react';
import { PageWrapper } from '@/components/Layout';

export const AboutPage: React.FC = () => {
  return (
    <PageWrapper
      title="About Infini-Convert"
      description="Infini-Convert by LoopHora: Free, fast, privacy-first file conversion directly in your browser."
    >
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div className="animate-fade-in" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <img
              src="/INFINI CONVERTER.png"
              alt="Infini-Convert"
              style={{
                width: 56,
                height: 56,
                objectFit: 'contain',
                borderRadius: 'var(--radius-md)',
              }}
            />
            <div>
              <span className="badge badge-protection" style={{ marginBottom: '4px' }}>
                <ShieldCheck style={{ width: 13, height: 13 }} />
                LoopHora Universal Utility
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-main)', lineHeight: 1.2 }}>
                About <span className="gradient-text">Infini-Convert</span>
              </h1>
            </div>
          </div>
          <p style={{ fontSize: '1rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
            Convert. Compress. Done. Designed from the ground up for speed, privacy, and zero server upload dependencies.
          </p>
        </div>

        <div className="card-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Our Mission
            </h2>
            <p style={{ color: 'var(--text-sub)', lineHeight: 1.65, fontSize: '0.875rem' }}>
              Conventional file conversion tools subject users to intrusive advertisements, artificial rate-limiting queues,
              hidden paywalls, and hazardous third-party file uploads.
            </p>
            <p style={{ color: 'var(--text-sub)', lineHeight: 1.65, fontSize: '0.875rem', marginTop: '10px' }}>
              <strong>Infini-Convert</strong> by LoopHora provides client-side conversion tools. Leveraging HTML5 APIs
              and native browser engines, processing occurs strictly on your device.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-sub)', paddingTop: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
              Core Architecture
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)' }}>
                <ShieldCheck style={{ width: 20, height: 20, color: 'var(--badge-green-text)', marginBottom: '6px' }} />
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '3px' }}>Local-First</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                  Conversions execute directly in browser memory. Files never touch a remote server.
                </p>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)' }}>
                <Zap style={{ width: 20, height: 20, color: 'var(--brand-blue)', marginBottom: '6px' }} />
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '3px' }}>Zero Latency</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                  No upload or download network bottlenecks. Fast local processing.
                </p>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)' }}>
                <UserX style={{ width: 20, height: 20, color: '#f59e0b', marginBottom: '6px' }} />
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '3px' }}>No Registration</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                  No accounts, passwords, email verification, or tracking cookies.
                </p>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)' }}>
                <Cpu style={{ width: 20, height: 20, color: '#818cf8', marginBottom: '6px' }} />
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '3px' }}>Browser-Native</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                  Powered by client-side browser libraries including pdf-lib and pdfjs-dist.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/" className="btn btn-primary">
            <span>Explore Converter Tools</span>
            <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
};
