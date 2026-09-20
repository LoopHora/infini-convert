// ===== BATCH RESULT =====
// Styled with Inficy Universal Product Design Standard

import React from 'react';
import { Download, Archive, CheckCircle2, RotateCcw } from 'lucide-react';
import { formatFileSize, calculateSavings, extractBasename } from '@/utils';
import type { ProcessingResult } from '@/types';

interface BatchResultProps {
  results: { original: File; result: ProcessingResult }[];
  onReset: () => void;
}

export const BatchResult: React.FC<BatchResultProps> = ({ results, onReset }) => {
  const totalOriginal = results.reduce((sum, r) => sum + r.original.size, 0);
  const totalResult = results.reduce((sum, r) => sum + r.result.size, 0);

  const [zipData, setZipData] = React.useState<{ objectUrl: string; filename: string } | null>(null);
  const [isZipping, setIsZipping] = React.useState(false);

  React.useEffect(() => {
    if (results.length <= 1) return;
    let active = true;
    let createdUrl = '';

    const generateZip = async () => {
      setIsZipping(true);
      try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const usedNames = new Set<string>();

        for (const r of results) {
          let fileName = r.result.filename || r.result.name || 'file';
          if (usedNames.has(fileName)) {
            const { basename, extension } = extractBasename(fileName);
            const ext = extension ? `.${extension}` : '';
            let counter = 1;
            while (usedNames.has(`${basename} (${counter})${ext}`)) {
              counter++;
            }
            fileName = `${basename} (${counter})${ext}`;
          }
          usedNames.add(fileName);
          zip.file(fileName, r.result.blob);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        if (!active) return;
        createdUrl = URL.createObjectURL(zipBlob);
        setZipData({
          objectUrl: createdUrl,
          filename: 'infini-convert-batch.zip',
        });
      } catch (err) {
        console.error('Failed to generate batch zip:', err);
      } finally {
        if (active) setIsZipping(false);
      }
    };

    generateZip();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [results]);

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Summary card */}
      <div className="card-panel" style={{ padding: '28px 24px', textAlign: 'center' }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          backgroundColor: 'var(--badge-green-bg)',
          border: '1px solid var(--badge-green-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 10px',
          color: 'var(--badge-green-text)',
        }}>
          <CheckCircle2 style={{ width: 22, height: 22 }} />
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
          Batch Completed ({results.length} files)
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-sub)', marginBottom: '18px' }}>
          All files converted locally and ready to download
        </p>

        {/* Stats grid */}
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
              Total Original
            </p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-sub)' }}>
              {formatFileSize(totalOriginal)}
            </p>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-sub)' }} />

          <div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Total Output
            </p>
            <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {formatFileSize(totalResult)}
            </p>
          </div>

          {totalResult < totalOriginal && (
            <>
              <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-sub)' }} />
              <div>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                  Saved
                </p>
                <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--badge-green-text)' }}>
                  {calculateSavings(totalOriginal, totalResult)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {results.length > 1 ? (
            isZipping ? (
              <button className="btn btn-primary" disabled style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Archive style={{ width: 16, height: 16, opacity: 0.7 }} />
                Preparing ZIP...
              </button>
            ) : zipData ? (
              <a
                className="btn btn-primary"
                href={zipData.objectUrl}
                download={zipData.filename}
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Archive style={{ width: 16, height: 16 }} />
                Download All as ZIP
              </a>
            ) : null
          ) : (
            <a
              className="btn btn-primary"
              href={results[0].result.objectUrl || results[0].result.url}
              download={results[0].result.filename || results[0].result.name}
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Download style={{ width: 16, height: 16 }} />
              Download
            </a>
          )}
          <button className="btn btn-ghost" onClick={onReset}>
            <RotateCcw style={{ width: 15, height: 15 }} />
            Convert More
          </button>
        </div>
      </div>

      {/* Item rows */}
      {results.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {results.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-card)',
              }}
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.result.filename || r.result.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', flexShrink: 0 }}>
                {formatFileSize(r.original.size)} → {formatFileSize(r.result.size)}
              </span>
              <a
                className="btn-icon"
                href={r.result.objectUrl || r.result.url}
                download={r.result.filename || r.result.name}
                title={`Download ${r.result.filename || r.result.name}`}
                aria-label={`Download ${r.result.filename || r.result.name}`}
                style={{
                  width: '26px',
                  height: '26px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                <Download style={{ width: 13, height: 13 }} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
