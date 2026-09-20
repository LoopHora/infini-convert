// ===== 404 NOT FOUND PAGE =====
// Styled with Inficy Universal Product Design Standard

import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Home, ArrowLeft } from 'lucide-react';
import { PageWrapper } from '@/components/Layout';

export const NotFoundPage: React.FC = () => {
  return (
    <PageWrapper
      title="Tool Not Found"
      description="The requested tool or page does not exist."
    >
      <div style={{ maxWidth: '480px', margin: '64px auto', textAlign: 'center' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--text-sub)',
        }}>
          <Search style={{ width: 24, height: 24 }} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '6px', color: 'var(--text-main)' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '14px' }}>
          Page or tool not found
        </h2>

        <p style={{ color: 'var(--text-dim)', marginBottom: '28px', fontSize: '0.875rem', lineHeight: 1.6 }}>
          The tool link might have moved or is unsupported. Use the links below to navigate back.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">
            <Home style={{ width: 15, height: 15 }} />
            Go to Home
          </Link>
          <Link to="/convert/jpg-to-png" className="btn btn-secondary">
            Convert JPG to PNG
          </Link>
          <Link to="/compress/image" className="btn btn-secondary">
            Compress Image
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
};
