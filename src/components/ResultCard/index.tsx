// ===== RESULT CARD =====
// Styled with Inficy Universal Product Design Standard

import React from 'react';
import { Download, CheckCircle2, RotateCcw, Sliders } from 'lucide-react';
import { formatFileSize, calculateSavings } from '@/utils';
import type { ProcessingResult } from '@/types';

interface ResultCardProps {
  originalSize: number;
  resultSize?: number;
  resultBlob?: Blob;
  resultName?: string;
  objectUrl?: string;
  filename?: string;
  result?: ProcessingResult;
  resultDimensions?: { width: number; height: number };
  onReset: () => void;
  onAdjust?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  originalSize,
  resultSize,
  resultBlob,
  resultName,
  objectUrl,
  filename,
  result,
  resultDimensions,
  onReset,
  onAdjust,
}) => {
  const effectiveSize = resultSize ?? result?.size ?? resultBlob?.size ?? 0;
  const effectiveFilename = filename || result?.filename || resultName || result?.name || 'download';
  const providedUrl = objectUrl || result?.objectUrl || result?.url;

  const [localUrl, setLocalUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!providedUrl && resultBlob) {
      const url = URL.createObjectURL(resultBlob);
      setLocalUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [providedUrl, resultBlob]);

  const effectiveUrl = providedUrl || localUrl || '';
  const savings = calculateSavings(originalSize, effectiveSize);
  const isSmaller = effectiveSize < originalSize;

  return (
    <div className="card-panel animate-slide-up" style={{ padding: '32px 24px', textAlign: 'center' }}>
      {/* Status icon badge */}
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        backgroundColor: 'var(--badge-green-bg)',
        border: '1px solid var(--badge-green-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px',
        color: 'var(--badge-green-text)',
      }}>
        <CheckCircle2 style={{ width: 24, height: 24 }} />
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
        Processing Complete
      </h3>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-sub)', marginBottom: '20px' }}>
        File ready for immediate local download
      </p>

      {/* Stats row */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '12px 24px',
        backgroundColor: 'var(--bg-app)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
            Original
          </p>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-sub)' }}>
            {formatFileSize(originalSize)}
          </p>
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-sub)' }} />

        <div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
            Result
          </p>
          <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {formatFileSize(effectiveSize)}
          </p>
        </div>

        {isSmaller && (
          <>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-sub)' }} />
            <div>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                Saved
              </p>
              <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--badge-green-text)' }}>
                {savings}
              </p>
            </div>
          </>
        )}
      </div>

      {resultDimensions && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
          Dimensions: {resultDimensions.width} × {resultDimensions.height}px
        </p>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a
          className="btn btn-primary"
          href={effectiveUrl}
          download={effectiveFilename}
          style={{ textDecoration: 'none' }}
        >
          <Download style={{ width: 16, height: 16 }} />
          Download File
        </a>

        {onAdjust && (
          <button className="btn btn-secondary" onClick={onAdjust}>
            <Sliders style={{ width: 15, height: 15 }} />
            Adjust Settings
          </button>
        )}

        <button className="btn btn-ghost" onClick={onReset}>
          <RotateCcw style={{ width: 15, height: 15 }} />
          Convert Another
        </button>
      </div>
    </div>
  );
};
