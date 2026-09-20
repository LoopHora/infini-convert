// ===== POWERPOINT PAGE =====
// 100% Client-side PowerPoint (.pptx) conversion, slide extraction, and PDF generation

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Presentation,
  FileText,
  RefreshCw,
  Sparkles,
  Download,
  Archive,
  ShieldCheck,
  Clock,
  RotateCcw,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { PageWrapper } from '@/components/Layout';
import { FileDropzone } from '@/components/FileDropzone';
import { ResultCard } from '@/components/ResultCard';
import { BatchResult } from '@/components/BatchResult';
import {
  getPptxMetadata,
  extractPptxText,
  renderPptxSlides,
  pptxToPdf,
  type PptxTextResult,
} from '@/engine/pptx';
import {
  formatFileSize,
  createObjectUrl,
  revokeObjectUrl,
  generateOutputFilename,
} from '@/utils';
import type { ProcessingResult } from '@/types';

interface ExtendedPptxTextResult extends PptxTextResult {
  mdUrl: string;
  mdName: string;
}

interface PowerPointPageProps {
  initialMode?: 'pdf' | 'png' | 'jpg' | 'text';
}

export const PowerPointPage: React.FC<PowerPointPageProps> = ({ initialMode }) => {
  const { toolId } = useParams<{ toolId?: string }>();

  // Resolve mode from initialMode, route param, or default to 'pdf'
  const resolveDefaultMode = (): 'pdf' | 'png' | 'jpg' | 'text' => {
    if (initialMode) return initialMode;
    if (toolId === 'pptx-to-png') return 'png';
    if (toolId === 'pptx-to-jpg') return 'jpg';
    if (toolId === 'pptx-to-text' || toolId === 'pptx-extract-text') return 'text';
    return 'pdf';
  };

  const [mode, setMode] = useState<'pdf' | 'png' | 'jpg' | 'text'>(resolveDefaultMode());
  const [file, setFile] = useState<File | null>(null);
  const [slideCount, setSlideCount] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [singleResult, setSingleResult] = useState<ProcessingResult | null>(null);
  const [batchResults, setBatchResults] = useState<{ original: File; result: ProcessingResult }[]>([]);
  const [textResult, setTextResult] = useState<ExtendedPptxTextResult | null>(null);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setError(null);
    setSingleResult(null);
    setBatchResults([]);
    setTextResult(null);

    try {
      const meta = await getPptxMetadata(selected);
      setSlideCount(meta.slideCount);
    } catch {
      setSlideCount(1);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(null);
    setError(null);

    try {
      if (mode === 'text') {
        const extracted = await extractPptxText(file);
        const mdBlob = new Blob([extracted.markdown], { type: 'text/markdown;charset=utf-8' });
        const mdName = generateOutputFilename(file.name, 'md');
        const mdUrl = createObjectUrl(mdBlob);

        setTextResult({
          ...extracted,
          mdUrl,
          mdName,
        });

        const txtBlob = new Blob([extracted.text], { type: 'text/plain;charset=utf-8' });
        const txtName = generateOutputFilename(file.name, 'txt');
        const txtUrl = createObjectUrl(txtBlob);

        setSingleResult({
          blob: txtBlob,
          objectUrl: txtUrl,
          filename: txtName,
          mimeType: 'text/plain',
          name: txtName,
          size: txtBlob.size,
          type: 'text/plain',
          url: txtUrl,
        });
      } else if (mode === 'pdf') {
        const pdfBlob = await pptxToPdf(file, (curr, total) => {
          setProgress({ current: curr, total });
        });
        const pdfName = generateOutputFilename(file.name, 'pdf');
        const pdfUrl = createObjectUrl(pdfBlob);

        setSingleResult({
          blob: pdfBlob,
          objectUrl: pdfUrl,
          filename: pdfName,
          mimeType: 'application/pdf',
          name: pdfName,
          size: pdfBlob.size,
          type: 'application/pdf',
          url: pdfUrl,
        });
      } else {
        // Mode: 'png' or 'jpg'
        const targetFormat = mode;
        const slides = await renderPptxSlides(file, {
          format: targetFormat,
          onProgress: (curr, total) => setProgress({ current: curr, total }),
        });

        const newResults = slides.map((s) => {
          const slideName = generateOutputFilename(file.name, 'presentation-slide', {
            slideNumber: s.slideNumber,
            targetFormat,
          });
          const slideUrl = createObjectUrl(s.blob);
          return {
            original: file,
            result: {
              blob: s.blob,
              objectUrl: slideUrl,
              filename: slideName,
              mimeType: s.blob.type,
              name: slideName,
              size: s.blob.size,
              type: s.blob.type,
              url: slideUrl,
              width: s.width,
              height: s.height,
            },
          };
        });

        if (newResults.length === 1) {
          setSingleResult(newResults[0].result);
        } else {
          setBatchResults(newResults);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'PowerPoint processing failed';
      setError(msg);
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  };

  const reset = () => {
    if (singleResult?.objectUrl) revokeObjectUrl(singleResult.objectUrl);
    batchResults.forEach((b) => {
      if (b.result.objectUrl) revokeObjectUrl(b.result.objectUrl);
    });
    if (textResult?.mdUrl) revokeObjectUrl(textResult.mdUrl);
    setFile(null);
    setSlideCount(0);
    setSingleResult(null);
    setBatchResults([]);
    setTextResult(null);
    setError(null);
  };

  return (
    <PageWrapper
      title="PowerPoint Converter (.PPTX)"
      description="Convert PowerPoint presentations to PDF, extract slide images, or extract text locally in your browser."
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Header */}
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
              color: '#f97316',
            }}>
              <Presentation style={{ width: 18, height: 18 }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              PowerPoint (.PPTX) Converter
            </h1>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-sub)' }}>
            Convert slides to PDF, PNG/JPG images, or extract slide text — 100% in-browser with zero upload.
          </p>
          <div className="badge badge-protection" style={{ marginTop: '10px' }}>
            <ShieldCheck style={{ width: 13, height: 13 }} />
            100% Local In-Browser Execution
          </div>
        </div>

        {/* Results */}
        {singleResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ResultCard
              originalSize={file?.size || singleResult.size}
              resultSize={singleResult.size}
              resultBlob={singleResult.blob}
              resultName={singleResult.filename || singleResult.name}
              objectUrl={singleResult.objectUrl}
              filename={singleResult.filename}
              onReset={reset}
              onAdjust={() => { setSingleResult(null); setTextResult(null); }}
            />

            {/* If Text Extraction was performed, also show Markdown download & preview */}
            {textResult && (
              <div className="card-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Text Preview ({textResult.slideCount} Slides)
                  </h3>
                  <a
                    className="btn btn-secondary btn-sm"
                    href={textResult.mdUrl}
                    download={textResult.mdName}
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download style={{ width: 14, height: 14 }} />
                    Download as Markdown (.md)
                  </a>
                </div>
                <div style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--bg-app)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-card)',
                }}>
                  {textResult.text}
                </div>
              </div>
            )}
          </div>
        ) : batchResults.length > 0 ? (
          <BatchResult results={batchResults} onReset={reset} />
        ) : (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FileDropzone
              onFiles={handleFiles}
              accept={['pptx']}
              multiple={false}
              compact={file !== null}
            />

            {file && (
              <>
                {/* File info banner */}
                <div className="card-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f97316',
                    }}>
                      <Presentation style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>{file.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {formatFileSize(file.size)} · {slideCount > 0 ? `${slideCount} slide${slideCount !== 1 ? 's' : ''} found` : 'Presentation'}
                      </p>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={reset} style={{ fontSize: '0.75rem' }}>
                    Change File
                  </button>
                </div>

                {/* Mode Selector */}
                <div className="card-panel" style={{ padding: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
                    Select Output Action
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    {[
                      { id: 'pdf', title: 'Convert to PDF', desc: '1 page per slide', icon: FileText },
                      { id: 'png', title: 'Export PNGs', desc: 'PNG slide images', icon: RefreshCw },
                      { id: 'jpg', title: 'Export JPGs', desc: 'JPG slide images', icon: RefreshCw },
                      { id: 'text', title: 'Extract Text', desc: 'Plain text & Markdown', icon: Sparkles },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSelected = mode === m.id;
                      return (
                        <button
                          key={m.id}
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setMode(m.id as any)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            padding: '12px 14px',
                            height: 'auto',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Icon style={{ width: 15, height: 15 }} />
                            <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{m.title}</span>
                          </div>
                          <span style={{ fontSize: '0.6875rem', opacity: isSelected ? 0.9 : 0.7, fontWeight: 400 }}>
                            {m.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Execute Button */}
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleProcess}
                  disabled={processing}
                  style={{ width: '100%' }}
                >
                  {processing ? (
                    <>
                      <Clock style={{ width: 18, height: 18, animation: 'spin 2s linear infinite' }} />
                      {progress
                        ? `Processing Slide ${progress.current} of ${progress.total}...`
                        : 'Converting Presentation...'}
                    </>
                  ) : (
                    <>
                      {mode === 'pdf' && 'Convert to PDF'}
                      {mode === 'png' && 'Export All Slides as PNG'}
                      {mode === 'jpg' && 'Export All Slides as JPG'}
                      {mode === 'text' && 'Extract Text Content'}
                    </>
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
