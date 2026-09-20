// ===== IMAGE TO PDF PAGE =====
// Styled with Inficy Universal Product Design Standard

import React, { useState, useCallback } from 'react';
import { FileText, ShieldCheck, ChevronUp, ChevronDown, RotateCw, X, Clock } from 'lucide-react';
import { PageWrapper } from '@/components/Layout';
import { FileDropzone } from '@/components/FileDropzone';
import { ResultCard } from '@/components/ResultCard';
import { imagesToPdf } from '@/engine/pdf';
import { decodeHeic, isHeicFormat } from '@/engine/codecs';
import { formatFileSize, generateId, generateOutputFilename, createObjectUrl, revokeObjectUrl } from '@/utils';
import type { PdfSettings, ProcessingResult } from '@/types';

interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
  rotation: number;
}

export const ImageToPdfPage: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [settings, setSettings] = useState<PdfSettings>({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 10,
    quality: 92,
  });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imagesRef = React.useRef(images);
  imagesRef.current = images;

  React.useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    const newItems: ImageItem[] = await Promise.all(
      files.map(async (file) => {
        let preview = '';
        if (isHeicFormat(file)) {
          try {
            const pngBlob = await decodeHeic(file);
            preview = URL.createObjectURL(pngBlob);
          } catch {
            preview = URL.createObjectURL(file);
          }
        } else {
          preview = URL.createObjectURL(file);
        }

        return {
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          preview,
          rotation: 0,
        };
      })
    );

    setImages((prev) => [...prev, ...newItems]);
    setResult(null);
    setError(null);
  }, []);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((img) => img.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    if (result?.objectUrl) revokeObjectUrl(result.objectUrl);
    setImages([]);
    setResult(null);
    setError(null);
  };

  const rotateImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
      )
    );
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    setImages((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleCreatePdf = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setError(null);

    try {
      const imagesForPdf = images.map((img) => ({
        blob: img.file,
        name: img.name,
        rotation: img.rotation,
      }));

      const pdfBlob = await imagesToPdf(imagesForPdf, settings);
      const pdfName = images.length === 1
        ? generateOutputFilename(images[0].name, 'pdf')
        : 'infini-convert-document.pdf';

      const pdfUrl = createObjectUrl(pdfBlob);
      setResult({
        blob: pdfBlob,
        objectUrl: pdfUrl,
        filename: pdfName,
        mimeType: 'application/pdf',
        name: pdfName,
        size: pdfBlob.size,
        type: 'application/pdf',
        url: pdfUrl,
      });
    } catch (err) {
      console.error(err);
      setError('Failed to generate PDF document. Please verify image formats.');
    } finally {
      setProcessing(false);
    }
  };

  const totalInputSize = images.reduce((sum, img) => sum + img.size, 0);

  return (
    <PageWrapper
      title="Images to PDF"
      description="Combine multiple images into a PDF document with page reordering and rotation."
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
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
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Image to PDF</h1>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-sub)' }}>
            Compile single or multiple images into a clean PDF document directly on your device.
          </p>
          <div className="badge badge-protection" style={{ marginTop: '10px' }}>
            <ShieldCheck style={{ width: 13, height: 13 }} />
            100% Local In-Browser Execution
          </div>
        </div>

        {result ? (
          <ResultCard
            originalSize={totalInputSize}
            resultSize={result.size}
            resultBlob={result.blob}
            resultName={result.filename || result.name}
            objectUrl={result.objectUrl}
            filename={result.filename}
            onReset={clearAll}
            onAdjust={() => setResult(null)}
          />
        ) : (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FileDropzone
              onFiles={handleFiles}
              accept={['jpg', 'jpeg', 'png', 'webp', 'bmp', 'avif', 'heic', 'heif']}
              compact={images.length > 0}
            />

            {images.length > 0 && (
              <>
                {/* Pages Reordering & Rotation Panel */}
                <div className="card-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Pages ({images.length})
                    </h2>
                    <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                      Clear all
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-app)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-card)',
                        }}
                      >
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: 'var(--bg-input)',
                          border: '1px solid var(--border-sub)',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-sub)',
                        }}>
                          {idx + 1}
                        </div>

                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-input)',
                          border: '1px solid var(--border-sub)',
                          overflow: 'hidden',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <img
                            src={img.preview}
                            alt=""
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              transform: `rotate(${img.rotation}deg)`,
                              transition: 'transform 0.2s ease',
                            }}
                          />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {img.name}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {formatFileSize(img.size)}
                            {img.rotation > 0 && ` · Rotated ${img.rotation}°`}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                          <button
                            className="btn-icon"
                            onClick={() => moveImage(idx, 'up')}
                            disabled={idx === 0}
                            title="Move page up"
                            aria-label="Move page up"
                            style={{ width: '26px', height: '26px', opacity: idx === 0 ? 0.2 : 1 }}
                          >
                            <ChevronUp style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => moveImage(idx, 'down')}
                            disabled={idx === images.length - 1}
                            title="Move page down"
                            aria-label="Move page down"
                            style={{ width: '26px', height: '26px', opacity: idx === images.length - 1 ? 0.2 : 1 }}
                          >
                            <ChevronDown style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => rotateImage(img.id)}
                            title="Rotate 90 degrees"
                            aria-label="Rotate 90 degrees"
                            style={{ width: '26px', height: '26px' }}
                          >
                            <RotateCw style={{ width: 13, height: 13 }} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => removeImage(img.id)}
                            title="Remove image"
                            aria-label="Remove image"
                            style={{ width: '26px', height: '26px' }}
                          >
                            <X style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PDF Configuration Settings */}
                <div className="card-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Document Settings</h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '6px' }}>
                        Page Size
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(['a4', 'letter', 'legal'] as const).map((size) => (
                          <button
                            key={size}
                            className={`btn btn-sm ${settings.pageSize === size ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSettings((s) => ({ ...s, pageSize: size }))}
                            style={{ flex: 1, textTransform: 'uppercase' }}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '6px' }}>
                        Orientation
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(['portrait', 'landscape'] as const).map((orient) => (
                          <button
                            key={orient}
                            className={`btn btn-sm ${settings.orientation === orient ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSettings((s) => ({ ...s, orientation: orient }))}
                            style={{ flex: 1, textTransform: 'capitalize' }}
                          >
                            {orient}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '6px' }}>
                      Margin: {settings.margin} mm
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { label: 'None (0mm)', val: 0 },
                        { label: 'Compact (5mm)', val: 5 },
                        { label: 'Normal (10mm)', val: 10 },
                        { label: 'Wide (20mm)', val: 20 },
                      ].map((m) => (
                        <button
                          key={m.val}
                          className={`btn btn-sm ${settings.margin === m.val ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setSettings((s) => ({ ...s, margin: m.val }))}
                          style={{ flex: 1 }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleCreatePdf}
                  disabled={processing}
                  style={{ width: '100%' }}
                >
                  {processing ? (
                    <>
                      <Clock style={{ width: 18, height: 18, animation: 'spin 2s linear infinite' }} />
                      Compiling PDF...
                    </>
                  ) : (
                    <>Generate PDF ({images.length} page{images.length !== 1 ? 's' : ''})</>
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
