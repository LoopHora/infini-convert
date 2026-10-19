// ===== HOME PAGE =====
// File-First Auto-Detect & Task-First Tool Exploration
// Styled with Inficy Universal Product Design Standard

import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Sliders, Minimize2, FileText, ArrowRight, ShieldCheck, Presentation } from 'lucide-react';
import { PageWrapper } from '@/components/Layout';
import { FileDropzone } from '@/components/FileDropzone';
import { AutoDetectWorkspace } from '@/components/AutoDetectWorkspace';
import { detectFiles, type DetectedFile, type BatchSummary } from '@/engine/detector';

const categories = [
  {
    title: 'Format Conversion',
    description: 'Convert image formats locally with flexible quality options',
    icon: RefreshCw,
    color: '#38bdf8',
    tools: [
      { id: 'jpg-to-png', label: 'JPG to PNG' },
      { id: 'png-to-jpg', label: 'PNG to JPG' },
      { id: 'jpg-to-webp', label: 'JPG to WebP' },
      { id: 'png-to-webp', label: 'PNG to WebP' },
      { id: 'heic-to-jpg', label: 'HEIC to JPG (iPhone)' },
      { id: 'heic-to-webp', label: 'HEIC to WebP (iPhone)' },
      { id: 'webp-to-jpg', label: 'WebP to JPG' },
    ],
    basePath: '/convert',
  },
  {
    title: 'File & Image Compression',
    description: 'Reduce PDF and image file size with 4K UHD or custom compression',
    icon: Minimize2,
    color: '#10b981',
    tools: [
      { id: 'compress-pdf', label: 'Compress PDF (4K & Custom)', path: '/compress/pdf' },
      { id: 'compress-jpg', label: 'Compress JPG' },
      { id: 'compress-png', label: 'Compress PNG' },
      { id: 'compress-webp', label: 'Compress WebP' },
      { id: 'compress-heic', label: 'Compress HEIC' },
      { id: 'compress-image', label: 'Compress Any File' },
    ],
    basePath: '/compress',
  },
  {
    title: 'Resize & Dimensions',
    description: 'Change image pixel dimensions with precise size controls',
    icon: Sliders,
    color: '#818cf8',
    tools: [
      { id: 'resize-image', label: 'Resize Image (Custom Pixels)', path: '/resize/image' },
      { id: 'resize-aspect', label: 'Lock Aspect Ratio Scaler', path: '/resize/image', subtitle: 'Change pixel dimensions with locked aspect ratio' },
    ],
    basePath: '/resize',
  },
  {
    title: 'PDF Utilities',
    description: 'Compress, convert, and extract multi-page PDF documents',
    icon: FileText,
    color: '#f59e0b',
    tools: [
      { id: 'compress-pdf', label: 'Compress PDF (4K & Custom)', path: '/compress/pdf' },
      { id: 'image-to-pdf', label: 'Images to PDF Document' },
      { id: 'pdf-to-jpg', label: 'Extract PDF to JPG' },
      { id: 'pdf-to-png', label: 'Extract PDF to PNG' },
    ],
    basePath: '/convert',
  },
  {
    title: 'PowerPoint (.PPTX)',
    description: 'Convert slides to PDF, image formats, or extract text',
    icon: Presentation,
    color: '#f97316',
    tools: [
      { id: 'pptx-to-pdf', label: 'PPTX to PDF Document' },
      { id: 'pptx-to-png', label: 'PPTX to PNG Slides' },
      { id: 'pptx-to-jpg', label: 'PPTX to JPG Slides' },
      { id: 'pptx-to-text', label: 'Extract Slide Text (.txt / .md)' },
    ],
    basePath: '/powerpoint',
  },
];

export const HomePage: React.FC = () => {
  const [detectedData, setDetectedData] = useState<{
    files: DetectedFile[];
    summary: BatchSummary;
  } | null>(null);

  const [isDetecting, setIsDetecting] = useState(false);

  const handleFiles = useCallback(async (rawFiles: File[]) => {
    if (rawFiles.length === 0) return;
    setIsDetecting(true);

    try {
      const result = await detectFiles(rawFiles);
      setDetectedData({
        files: result.detected,
        summary: result.summary,
      });
    } catch (err) {
      console.error('File detection failed:', err);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const handleReset = () => {
    setDetectedData(null);
  };

  return (
    <PageWrapper
      title="Convert. Compress. Done."
      description="Free, privacy-first file converter. Convert images, compress files, resize photos — all locally in your browser."
    >
      {/* If files dropped -> Render Auto-Detect Workspace */}
      {detectedData ? (
        <AutoDetectWorkspace
          files={detectedData.files}
          summary={detectedData.summary}
          onReset={handleReset}
        />
      ) : (
        /* Default Home Hero: File-first Dropzone */
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 44px', position: 'relative' }}>
          <div className="animate-fade-in">
            <span className="badge badge-protection" style={{ marginBottom: '14px' }}>
              <ShieldCheck style={{ width: 14, height: 14 }} />
              100% Local In-Browser Processing
            </span>
          </div>

          <h1 className="animate-fade-in" style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.25rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: 'var(--text-main)',
            marginBottom: '12px',
          }}>
            Convert. Compress. <span className="gradient-text">Done.</span>
          </h1>

          <p className="animate-fade-in" style={{
            fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
            color: 'var(--text-sub)',
            fontWeight: 400,
            marginBottom: '28px',
          }}>
            Drop any file. We detect the format and show compatible actions instantly.
          </p>

          {/* Central Dropzone */}
          <div className="animate-slide-up">
            <FileDropzone onFiles={handleFiles} disabled={isDetecting} allowAllTypes={true} />
          </div>

          {isDetecting && (
            <div style={{ marginTop: '16px', color: 'var(--text-sub)', fontSize: '0.8125rem' }}>
              Analyzing file signatures locally...
            </div>
          )}
        </div>
      )}

      {/* Task-First Tool Explorer: Always accessible below */}
      <div style={{ marginTop: detectedData ? '48px' : '0' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Explore All Conversion & Utility Tools
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Choose a dedicated tool or drop a file above to begin
          </p>
        </div>

        <div className="stagger-children responsive-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          maxWidth: '1080px',
          margin: '0 auto',
        }}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.title} className="card-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: cat.color,
                  }}>
                    <Icon style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>{cat.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{cat.description}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '12px' }}>
                  {cat.tools.map((tool) => {
                    const toolObj = tool as { id: string; label: string; path?: string; subtitle?: string };
                    const targetUrl = toolObj.path
                      ? toolObj.path
                      : tool.id === 'image-to-pdf'
                      ? '/convert/image-to-pdf'
                      : tool.id === 'pdf-to-jpg'
                      ? '/convert/pdf-to-jpg'
                      : tool.id === 'pdf-to-png'
                      ? '/convert/pdf-to-png'
                      : `${cat.basePath}/${tool.id.replace('compress-', '')}`;

                    return (
                      <Link
                        key={tool.id}
                        to={targetUrl}
                        title={toolObj.subtitle || toolObj.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          color: 'var(--text-sub)',
                          textDecoration: 'none',
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-nav-hover)';
                          e.currentTarget.style.color = 'var(--text-main)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-sub)';
                        }}
                      >
                        <span>{tool.label}</span>
                        <ArrowRight style={{ width: 13, height: 13, opacity: 0.6 }} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust & Architecture Banner */}
      <div style={{
        maxWidth: '720px',
        margin: '40px auto 0',
        textAlign: 'center',
      }}>
        <div className="card-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck style={{ width: 18, height: 18, color: 'var(--badge-green-text)' }} />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
              100% Client-Side Privacy
            </h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
            Every file is processed directly in your browser.
            No data ever leaves your computer or phone.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
};
