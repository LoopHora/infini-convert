// ===== CONVERT PAGE =====
// Dynamic tool page for image format conversion

import React, { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RefreshCw, ShieldCheck, ArrowRight, Clock } from 'lucide-react';
import { PageWrapper } from '@/components/Layout';
import { FileDropzone } from '@/components/FileDropzone';
import { FileList } from '@/components/FileList';
import { ResultCard } from '@/components/ResultCard';
import { BatchResult } from '@/components/BatchResult';
import { getToolById, getRelatedTools } from '@/engine/registry';
import { convertImage, convertHeic } from '@/engine/codecs';
import {
  generateId,
  getFileExtension,
  replaceExtension,
  createObjectUrl,
  revokeObjectUrl,
  getImageDimensions,
  generateOutputFilename,
} from '@/utils';
import type { FileItem, ProcessingResult } from '@/types';

export const ConvertPage: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const tool = getToolById(toolId || '');

  const [files, setFiles] = useState<FileItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ original: File; result: ProcessingResult }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const relatedTools = tool ? getRelatedTools(tool.id) : [];

  const handleFiles = useCallback(
    async (newFiles: File[]) => {
      const items: FileItem[] = [];
      for (const file of newFiles) {
        let width: number | undefined;
        let height: number | undefined;
        try {
          if (file.type.startsWith('image/') || getFileExtension(file.name) !== 'pdf') {
            const dims = await getImageDimensions(file);
            width = dims.width;
            height = dims.height;
          }
        } catch { /* ignore */ }

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
      setError(null);
    },
    []
  );

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));
  const clearFiles = () => { setFiles([]); setResults([]); setError(null); };

  const handleConvert = async () => {
    if (!tool || files.length === 0) return;
    setProcessing(true);
    setError(null);
    const outputFormat = tool.outputFormats[0];
    const newResults: { original: File; result: ProcessingResult }[] = [];

    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      const item = updatedFiles[i];
      try {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'processing' as const, progress: 50 } : f
          )
        );

        let blob: Blob;
        if (tool.engine === 'heic') {
          blob = await convertHeic(item.file, outputFormat);
        } else {
          blob = await convertImage(item.file, outputFormat);
        }

        const resultName = generateOutputFilename(item.name, outputFormat);
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
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'complete' as const, progress: 100, result } : f
          )
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: 'error' as const, error: 'Conversion failed' }
              : f
          )
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
    setError(null);
  };

  if (!tool) {
    return (
      <PageWrapper title="Tool Not Found">
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>Tool not found</h1>
          <p style={{ color: 'var(--text-sub)', marginBottom: '24px' }}>
            The conversion tool you're looking for doesn't exist.
          </p>
          <Link to="/" className="btn btn-primary">Return Home</Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={tool.name}
      description={tool.description}
    >
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Header Title & Protection Badge */}
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
              color: 'var(--brand-blue)',
            }}>
              <RefreshCw style={{ width: 18, height: 18 }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{tool.name}</h1>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-sub)' }}>{tool.description}</p>
          <div className="badge badge-protection" style={{ marginTop: '10px' }}>
            <ShieldCheck style={{ width: 13, height: 13 }} />
            100% Local In-Browser Execution
          </div>
        </div>

        {/* Results or Conversion workspace */}
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
            />
          ) : (
            <BatchResult results={results} onReset={reset} />
          )
        ) : (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FileDropzone
              onFiles={handleFiles}
              accept={tool.inputFormats}
              compact={files.length > 0}
            />

            <FileList
              files={files}
              onRemove={removeFile}
              onClear={clearFiles}
            />

            {files.length > 0 && (
              <button
                className="btn btn-primary btn-lg"
                onClick={handleConvert}
                disabled={processing}
                style={{ width: '100%' }}
              >
                {processing ? (
                  <>
                    <Clock style={{ width: 18, height: 18, animation: 'spin 2s linear infinite' }} />
                    Converting...
                  </>
                ) : (
                  <>Convert {files.length > 1 ? `${files.length} Files` : 'File'}</>
                )}
              </button>
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

        {/* How to use */}
        <div style={{ marginTop: '44px' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
            How it works
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              `Select or drop ${tool.inputFormats.map(f => `.${f}`).join('/')} image${tool.supportsBatch ? '(s)' : ''}`,
              `Click Convert to encode into ${tool.outputFormats.map(f => `.${f.toUpperCase()}`).join('/')}`,
              'Download processed files directly with zero server upload',
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
                  color: 'var(--brand-blue)',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-sub)' }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related tools */}
        {relatedTools.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              Related Tools
            </h2>
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
              {relatedTools.map((rt) => {
                const link = rt.id === 'image-to-pdf'
                  ? '/convert/image-to-pdf'
                  : rt.id === 'pdf-to-jpg'
                  ? '/convert/pdf-to-jpg'
                  : rt.id === 'pdf-to-png'
                  ? '/convert/pdf-to-png'
                  : rt.category === 'compress'
                  ? `/compress/${rt.id.replace('compress-', '')}`
                  : rt.category === 'resize'
                  ? '/resize/image'
                  : `/convert/${rt.id}`;

                return (
                  <Link
                    key={rt.id}
                    to={link}
                    className="card-panel"
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textDecoration: 'none',
                      color: 'var(--text-main)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                    }}
                  >
                    <span>{rt.name}</span>
                    <ArrowRight style={{ width: 13, height: 13, color: 'var(--text-dim)' }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
