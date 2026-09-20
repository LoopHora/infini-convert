// ===== PRIVACY POLICY PAGE =====
// Styled with Inficy Universal Product Design Standard

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PageWrapper } from '@/components/Layout';

export const PrivacyPage: React.FC = () => {
  return (
    <PageWrapper
      title="Privacy Policy — 100% Local Processing"
      description="Zero data collection, zero cloud storage. Infini-Convert provides 100% client-side privacy."
    >
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div className="animate-fade-in" style={{ marginBottom: '28px' }}>
          <span className="badge badge-protection" style={{ marginBottom: '10px' }}>
            <ShieldCheck style={{ width: 13, height: 13 }} />
            100% Local Architecture
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '10px', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
            Privacy is our foundational principle. Your files never transit through or reside on any remote server.
          </p>
        </div>

        <div className="card-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              1. Local-Only Execution
            </h2>
            <p style={{ color: 'var(--text-sub)', lineHeight: 1.65, fontSize: '0.875rem' }}>
              When you select or drop a file into Infini-Convert, the browser reads the bytes locally into memory.
              Processing (including encoding, decoding, resizing, and PDF generation) executes exclusively via standard
              browser JavaScript and HTML5 Canvas APIs inside your client sandbox.
            </p>
            <div style={{
              margin: '14px 0 0',
              padding: '12px 16px',
              backgroundColor: 'var(--badge-green-bg)',
              border: '1px solid var(--badge-green-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--badge-green-text)',
              fontWeight: 600,
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>Zero bytes are uploaded to the cloud or third-party APIs.</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-sub)', paddingTop: '18px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              2. Ephemeral In-Memory Buffers
            </h2>
            <p style={{ color: 'var(--text-sub)', lineHeight: 1.65, fontSize: '0.875rem' }}>
              File blobs and result downloads utilize temporary browser object URLs (<code style={{ color: 'var(--brand-blue)' }}>blob:</code> scheme)
              which are immediately revoked from memory when operations conclude. Nothing is saved to persistent device storage unless you click Download.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-sub)', paddingTop: '18px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              3. No User Identifiers or Tracking
            </h2>
            <p style={{ color: 'var(--text-sub)', lineHeight: 1.65, fontSize: '0.875rem' }}>
              We do not track user behavior, file names, file contents, or personal information.
              There are no user accounts, advertisement scripts, or cross-site tracking pixels.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-sub)', paddingTop: '18px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              4. Full Verifiability
            </h2>
            <p style={{ color: 'var(--text-sub)', lineHeight: 1.65, fontSize: '0.875rem' }}>
              You can verify this at any time: open your browser's Developer Tools (F12) to the Network tab during any conversion.
              You will observe zero network payload activity during file processing.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/" className="btn btn-secondary">
            <ArrowLeft style={{ width: 15, height: 15 }} />
            <span>Return to Converter</span>
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
};
