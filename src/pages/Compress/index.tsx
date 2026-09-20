// ===== COMPRESS PAGE =====
// Styled with Inficy Universal Product Design Standard

import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Minimize2, ShieldCheck, Clock } from 'lucide-react';
import { PageWrapper } from '@/components/Layout';
import { FileDropzone } from '@/components/FileDropzone';
import { FileList } from '@/components/FileList';
import { CompressionControls } from '@/components/CompressionControls';
import { ResultCard } from '@/components/ResultCard';
import { BatchResult } from '@/components/BatchResult';
import { compressImage } from '@/engine/codecs';
import {
  generateId,
  getFileExtension,
  createObjectUrl,
  revokeObjectUrl,
  getImageDimensions,
  generateOutputFilename,
} from '@/utils';
import type { FileItem, ProcessingResult, CompressionSettings } from '@/types';

const formatTitles: Record<string, { title: string; desc: string; accept: string[] }> = {
  jpg: { title: 'Compress JPG', desc: 'Reduce JPG file size with adjustable quality controls.', accept: ['jpg', 'jpeg'] },
  png: { title: 'Compress PNG', desc: 'Reduce PNG file size with adjustable quality controls.', accept: ['png'] },
  webp: { title: 'Compress WebP', desc: 'Reduce WebP file size with adjustable quality controls.', accept: ['webp'] },
  heic: { title: 'Compress HEIC (iPhone Photo)', desc: 'Compress Apple HEIC photos locally in your browser.', accept: ['heic', 'heif'] },
  image: { title: 'Compress Any Image', desc: 'Compress image files locally with before/after size inspection.', accept: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'heic', 'heif'] },
};

export const CompressPage: React.FC = () => {
  const { format } = useParams<{ format: string }>();
  const info = formatTitles[format || 'image'] || formatTitles.image;

  const [files, setFiles] = useState<FileItem[]>([]);
  const [settings, setSettings] = useState<CompressionSettings>({
    mode: 'preset',
    preset: 'balanced',
    quality: 75,
    targetSize: 500 * 1024,
  });
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ original: File; result: ProcessingResult }[]>([]);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    const items: FileItem[] = [];
    for (const file of newFiles) {
      let width: number | undefined;
      let height: number | undefined;
      try {
        const dims = await getImageDimensions(file);
        width = dims.width;
        height = dims.height;
      } catch { /* skip */ }

      items.push({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        extension: getFileExtension(file.name),
        width,
        height,
        status: 'idle',
        progress: 0,
      });
    }
    setFiles((prev) => [...prev, ...items]);
    setResults([]);
  }, []);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));
  const clearFiles = () => { setFiles([]); setResults([]); };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    const newResults: { original: File; result: ProcessingResult }[] = [];

    for (const item of files) {
      try {
        setFiles((prev) =>
          prev.map((f) => f.id === item.id ? { ...f, status: 'processing' as const, progress: 50 } : f)
        );

        const blob = await compressImage(item.file, settings);
        const resultName = generateOutputFilename(item.name, 'compressed', { mimeType: blob.type });
        const url = createObjectUrl(blob);

        const result: ProcessingResult = {
          blob,
          objectUrl: url,
          filename: resultName,
          mimeType: blob.type,
          name: resultName,
          size: blob.size,
          type: blob.type,
          url,
        };

        newResults.push({ original: item.file, result });

        setFiles((prev) =>
          prev.map((f) => f.id === item.id ? { ...f, status: 'complete' as const, progress: 100, result } : f)
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) => f.id === item.id ? { ...f, status: 'error' as const, error: 'Compression failed' } : f)
        );
      }
    }

    setResults(newResults);
    setProcessing(false);
  };

  const reset = () => {
    results.forEach((r) => {
      if (r.result.objectUrl) revokeObjectUrl(r.result.objectUrl);
      else if (r.result.url) revokeObjectUrl(r.result.url);
    });
    setFiles([]);
    setResults([]);
  };

  return (
    <PageWrapper title={info.title} description={info.desc}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Title Header */}
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
              color: '#10b981',
            }}>
              <Minimize2 style={{ width: 18, height: 18 }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{info.title}</h1>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-sub)' }}>{info.desc}</p>
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
              accept={info.accept}
              compact={files.length > 0}
            />

            <FileList files={files} onRemove={removeFile} onClear={clearFiles} />

            {files.length > 0 && (
              <>
                <div className="card-panel" style={{ padding: '20px' }}>
                  <CompressionControls settings={settings} onChange={setSettings} />
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleCompress}
                  disabled={processing}
                  style={{ width: '100%' }}
                >
                  {processing ? (
                    <>
                      <Clock style={{ width: 18, height: 18, animation: 'spin 2s linear infinite' }} />
                      Compressing...
                    </>
                  ) : (
                    <>Compress {files.length > 1 ? `${files.length} Files` : 'File'}</>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* How it works */}
        <div style={{ marginTop: '44px' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
            How it works
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'Drop single or multiple image files',
              'Select Quality Preset, custom quality slider, or Target Size (e.g. 500 KB)',
              'Click Compress to recalculate pixels locally and download the optimized output',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#10b981',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-sub)' }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
