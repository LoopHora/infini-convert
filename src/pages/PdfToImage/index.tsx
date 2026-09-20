// ===== PDF TO IMAGE PAGE =====
// Styled with Inficy Universal Product Design Standard

import React, { useState, useCallback } from 'react';
import { FileText, ShieldCheck, Clock } from 'lucide-react';
import { PageWrapper } from '@/components/Layout';
import { FileDropzone } from '@/components/FileDropzone';
import { ResultCard } from '@/components/ResultCard';
import { BatchResult } from '@/components/BatchResult';
import { pdfToImages, getPdfPageCount } from '@/engine/pdf';
import { formatFileSize, createObjectUrl, revokeObjectUrl, generateOutputFilename } from '@/utils';
import type { PdfToImageSettings, ProcessingResult } from '@/types';

interface PdfToImagePageProps {
  initialFormat?: 'jpg' | 'png';
}

export const PdfToImagePage: React.FC<PdfToImagePageProps> = ({ initialFormat = 'jpg' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [format, setFormat] = useState<'jpg' | 'png'>(initialFormat);
  const [pageSelectionMode, setPageSelectionMode] = useState<'all' | 'custom'>('all');
  const [customPagesInput, setCustomPagesInput] = useState<string>('');
  const [quality, setQuality] = useState<number>(90);
  const [scale, setScale] = useState<number>(2);

  const [processing, setProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<{ current: number; total: number } | null>(null);
  const [results, setResults] = useState<{ original: File; result: ProcessingResult }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const pdfFile = files[0];
    setFile(pdfFile);
    setResults([]);
    setError(null);

    try {
      const pages = await getPdfPageCount(pdfFile);
      setTotalPages(pages);
    } catch (err) {
      console.error(err);
      setError('Could not read PDF. File may be encrypted or corrupted.');
    }
  }, []);

  const parsePageRange = (input: string, max: number): number[] => {
    const pages = new Set<number>();
    const parts = input.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(max, Math.max(start, end));
          for (let p = from; p <= to; p++) {
            pages.add(p);
          }
        }
      } else {
        const p = parseInt(part, 10);
        if (!isNaN(p) && p >= 1 && p <= max) {
          pages.add(p);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setCurrentProgress({ current: 0, total: totalPages });

    try {
      let pagesToRender: 'all' | number[] = 'all';
      if (pageSelectionMode === 'custom') {
        const parsed = parsePageRange(customPagesInput, totalPages);
        if (parsed.length === 0) {
          throw new Error('Please enter a valid page range (e.g., 1, 3-5).');
        }
        pagesToRender = parsed;
      }

      const settings: PdfToImageSettings = {
        format,
        quality,
        pages: pagesToRender,
        scale,
      };

      const extracted = await pdfToImages(file, settings, (curr, total) => {
        setCurrentProgress({ current: curr, total });
      });

      const newResults: { original: File; result: ProcessingResult }[] = extracted.map((item) => {
        const pageName = generateOutputFilename(file.name, 'pdf-page', {
          pageNumber: item.pageNumber,
          targetFormat: format,
        });
        const url = createObjectUrl(item.blob);
        return {
          original: file,
          result: {
            blob: item.blob,
            objectUrl: url,
            filename: pageName,
            mimeType: item.blob.type,
            name: pageName,
            size: item.blob.size,
            type: item.blob.type,
            url,
            width: item.width,
            height: item.height,
          },
        };
      });

      setResults(newResults);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'PDF extraction failed';
      setError(msg);
    } finally {
      setProcessing(false);
      setCurrentProgress(null);
    }
  };

  const reset = () => {
    results.forEach((r) => {
      if (r.result.objectUrl) revokeObjectUrl(r.result.objectUrl);
      else if (r.result.url) revokeObjectUrl(r.result.url);
    });
    setFile(null);
    setTotalPages(0);
    setResults([]);
    setError(null);
  };

  return (
    <PageWrapper
      title={`PDF to ${format.toUpperCase()}`}
      description={`Extract ${format.toUpperCase()} images from PDF documents locally in your browser.`}
    >
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div className="animate-fade-in" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}>
              <FileText style={{ width: 18, height: 18 }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>PDF to {format.toUpperCase()}</h1>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-sub)' }}>
            Extract individual pages or render all pages into {format.toUpperCase()} image files.
          </p>
          <div className="badge badge-protection" style={{ marginTop: '10px' }}>
            <ShieldCheck style={{ width: 13, height: 13 }} />
            100% Local In-Browser Execution
          </div>
        </div>

        {results.length > 0 ? (
          results.length === 1 ? (
            <ResultCard
              originalSize={results[0].original.size}
              resultSize={results[0].result.size}
              resultBlob={results[0].result.blob}
              resultName={results[0].result.filename || results[0].result.name}
              objectUrl={results[0].result.objectUrl}
              filename={results[0].result.filename}
              resultDimensions={results[0].result.width && results[0].result.height ? { width: results[0].result.width, height: results[0].result.height } : undefined}
              onReset={reset}
              onAdjust={() => setResults([])}
            />
          ) : (
            <BatchResult results={results} onReset={reset} />
          )
        ) : (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FileDropzone
              onFiles={handleFiles}
              accept={['pdf']}
              multiple={false}
              compact={file !== null}
            />

            {file && (
              <>
                <div className="card-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-blue)',
                    }}>
                      <FileText style={{ width: 16, height: 16 }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>{file.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {formatFileSize(file.size)} {totalPages > 0 && `· ${totalPages} pages found`}
                      </p>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={reset} style={{ fontSize: '0.75rem' }}>
                    Change File
                  </button>
                </div>

                <div className="card-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Extraction Options</h2>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '6px' }}>
                      Format
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {(['jpg', 'png'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          className={`btn btn-sm ${format === fmt ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setFormat(fmt)}
                          style={{ flex: 1, textTransform: 'uppercase' }}
                        >
                          {fmt === 'jpg' ? 'JPG (Compact)' : 'PNG (Standard)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '6px' }}>
                      Pages
                    </label>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: pageSelectionMode === 'custom' ? '10px' : '0' }}>
                      <button
                        className={`btn btn-sm ${pageSelectionMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPageSelectionMode('all')}
                        style={{ flex: 1 }}
                      >
                        All Pages ({totalPages})
                      </button>
                      <button
                        className={`btn btn-sm ${pageSelectionMode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPageSelectionMode('custom')}
                        style={{ flex: 1 }}
                      >
                        Custom Range
                      </button>
                    </div>

                    {pageSelectionMode === 'custom' && (
                      <div>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. 1, 3-5"
                          value={customPagesInput}
                          onChange={(e) => setCustomPagesInput(e.target.value)}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                          Specify single pages or comma-separated ranges (up to page {totalPages}).
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '6px' }}>
                      Resolution Scale
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { label: 'Standard (1.5x)', val: 1.5 },
                        { label: 'High (2.0x)', val: 2 },
                        { label: 'Ultra (3.0x)', val: 3 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          className={`btn btn-sm ${scale === item.val ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setScale(item.val)}
                          style={{ flex: 1 }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {format === 'jpg' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)' }}>
                          JPG Quality
                        </label>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>{quality}%</span>
                      </div>
                      <input
                        type="range"
                        className="slider"
                        min={50}
                        max={100}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                {processing && currentProgress && (
                  <div className="card-panel" style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem', color: 'var(--text-sub)' }}>
                      <span>Extracting PDF pages...</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentProgress.current} / {currentProgress.total}</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.round((currentProgress.current / (currentProgress.total || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleConvert}
                  disabled={processing}
                  style={{ width: '100%' }}
                >
                  {processing ? (
                    <>
                      <Clock style={{ width: 18, height: 18, animation: 'spin 2s linear infinite' }} />
                      Extracting Pages...
                    </>
                  ) : (
                    <>Extract PDF to {format.toUpperCase()}</>
                  )}
                </button>
              </>
            )}

            {error && (
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-block-row)',
                border: '1px solid var(--border-block-row)',
                color: '#ef4444',
                fontSize: '0.8125rem',
              }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
