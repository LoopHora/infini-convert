// ===== AUTO-DETECT WORKSPACE =====
// "Drop a file. Infini-Convert figures out what you can do with it."
// Fully deterministic, local client-side processing, ranking, and inline execution.

import React, { useState } from 'react';
import {
  Minimize2,
  RefreshCw,
  Sliders,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  X,
  Layers,
  Presentation,
} from 'lucide-react';
import type { DetectedFile, BatchSummary } from '@/engine/detector';
import { resolveActions, type ResolvedAction } from '@/engine/resolver';
import { CompressionControls } from '@/components/CompressionControls';
import { ResizeControls } from '@/components/ResizeControls';
import { ResultCard } from '@/components/ResultCard';
import { BatchResult } from '@/components/BatchResult';
import { convertImage, convertHeic, compressImage, resizeImage } from '@/engine/codecs';
import { imagesToPdf, pdfToImages, compressPdf } from '@/engine/pdf';
import {
  formatFileSize,
  createObjectUrl,
  revokeObjectUrl,
  replaceExtension,
  getFileExtension,
  generateOutputFilename,
} from '@/utils';
import type {
  CompressionSettings,
  ResizeSettings,
  PdfSettings,
  PdfToImageSettings,
  ProcessingResult,
} from '@/types';

interface AutoDetectWorkspaceProps {
  files: DetectedFile[];
  summary: BatchSummary;
  onReset: () => void;
}

export const AutoDetectWorkspace: React.FC<AutoDetectWorkspaceProps> = ({
  files,
  summary,
  onReset,
}) => {
  const resolution = resolveActions(files, summary);
  const [selectedAction, setSelectedAction] = useState<ResolvedAction | null>(
    resolution.primaryActions[0] || null
  );
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Settings states
  const [compressionSettings, setCompressionSettings] = useState<CompressionSettings>({
    mode: 'preset',
    preset: 'balanced',
    quality: 75,
    targetSize: 500 * 1024,
  });

  const [resizeSettings, setResizeSettings] = useState<ResizeSettings>({
    width: 1080,
    height: 0,
    lockAspectRatio: true,
  });

  const [pdfSettings, setPdfSettings] = useState<PdfSettings>({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 10,
    quality: 92,
  });

  const [pdfExtractSettings, setPdfExtractSettings] = useState<PdfToImageSettings>({
    format: 'jpg',
    quality: 90,
    pages: 'all',
    scale: 2,
  });

  // Processing & result states
  const [processing, setProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<{ current: number; total: number } | null>(null);
  const [singleResult, setSingleResult] = useState<ProcessingResult | null>(null);
  const [batchResults, setBatchResults] = useState<{ original: File; result: ProcessingResult }[]>([]);
  const [failedFiles, setFailedFiles] = useState<{ name: string; reason: string }[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const cancelRef = React.useRef(false);
  const handleCancel = () => {
    cancelRef.current = true;
  };

  React.useEffect(() => {
    if (files.length > 0 && files[0].width && files[0].height) {
      setResizeSettings({
        width: files[0].width,
        height: files[0].height,
        lockAspectRatio: true,
      });
      if (files[0].width > files[0].height) {
        setPdfSettings((p) => ({ ...p, orientation: 'auto' }));
      }
    }
    return () => {
      files.forEach((f) => {
        if (f.previewUrl) revokeObjectUrl(f.previewUrl);
      });
    };
  }, [files]);

  const getActionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Minimize2': return Minimize2;
      case 'Sliders': return Sliders;
      case 'FileText': return FileText;
      case 'Layers': return Layers;
      case 'Presentation': return Presentation;
      default: return RefreshCw;
    }
  };

  const handleExecute = async () => {
    if (!selectedAction || files.length === 0) return;
    cancelRef.current = false;
    setProcessing(true);
    setGeneralError(null);
    setFailedFiles([]);
    setProgressStatus({ current: 0, total: files.length });

    try {
      // 0. POWERPOINT ACTIONS (PPTX -> PDF, PNG, JPG, Text)
      if (selectedAction.engine === 'pptx' || (files.length === 1 && files[0].isPptx)) {
        const pptxFile = files[0].file;

        if (selectedAction.id === 'pptx-extract-text') {
          const { extractPptxText } = await import('@/engine/pptx');
          const extracted = await extractPptxText(pptxFile);
          const txtBlob = new Blob([extracted.text], { type: 'text/plain;charset=utf-8' });
          const txtName = generateOutputFilename(pptxFile.name, 'txt');

          const url = createObjectUrl(txtBlob);
          const result: ProcessingResult = {
            blob: txtBlob,
            objectUrl: url,
            filename: txtName,
            mimeType: 'text/plain',
            name: txtName,
            size: txtBlob.size,
            type: 'text/plain',
            url,
          };

          setSingleResult(result);
          setProcessing(false);
          return;
        }

        if (selectedAction.id === 'pptx-to-pdf') {
          const { pptxToPdf } = await import('@/engine/pptx');
          const pdfBlob = await pptxToPdf(pptxFile, (curr, total) => {
            setProgressStatus({ current: curr, total });
          });
          const pdfName = generateOutputFilename(pptxFile.name, 'pdf');

          const url = createObjectUrl(pdfBlob);
          const result: ProcessingResult = {
            blob: pdfBlob,
            objectUrl: url,
            filename: pdfName,
            mimeType: 'application/pdf',
            name: pdfName,
            size: pdfBlob.size,
            type: 'application/pdf',
            url,
          };

          setSingleResult(result);
          setProcessing(false);
          return;
        }

        if (selectedAction.id === 'pptx-to-png' || selectedAction.id === 'pptx-to-jpg') {
          const targetFormat = (selectedAction.targetFormat as 'png' | 'jpg') || 'png';
          const { renderPptxSlides } = await import('@/engine/pptx');
          const slides = await renderPptxSlides(pptxFile, {
            format: targetFormat,
            onProgress: (curr, total) => setProgressStatus({ current: curr, total }),
          });

          const newResults = slides.map((s) => {
            const slideName = generateOutputFilename(pptxFile.name, 'presentation-slide', {
              slideNumber: s.slideNumber,
              targetFormat,
            });
            const slideUrl = createObjectUrl(s.blob);
            return {
              original: pptxFile,
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
          setProcessing(false);
          return;
        }
      }

      // 1. COMBINE ALL IMAGES INTO ONE PDF
      if (selectedAction.id === 'image-to-pdf-batch' || (files.length === 1 && selectedAction.category === 'pdf' && files[0].isImage)) {
        const imagesForPdf = files.map((f) => ({
          blob: f.file,
          name: f.name,
          rotation: 0,
        }));
        const pdfBlob = await imagesToPdf(imagesForPdf, pdfSettings);
        const pdfName = files.length === 1
          ? generateOutputFilename(files[0].name, 'pdf')
          : 'infini-convert-document.pdf';

        const pdfUrl = createObjectUrl(pdfBlob);
        const result: ProcessingResult = {
          blob: pdfBlob,
          objectUrl: pdfUrl,
          filename: pdfName,
          mimeType: 'application/pdf',
          name: pdfName,
          size: pdfBlob.size,
          type: 'application/pdf',
          url: pdfUrl,
        };

        if (files.length === 1) {
          setSingleResult(result);
        } else {
          setBatchResults([{ original: files[0].file, result }]);
        }
        setProcessing(false);
        return;
      }

      // 2. EXTRACT PDF TO IMAGES
      if (selectedAction.category === 'pdf' && files[0].isPdf) {
        const pdfFile = files[0].file;
        const targetFormat = selectedAction.targetFormat as 'jpg' | 'png' || 'jpg';
        const extracted = await pdfToImages(
          pdfFile,
          { ...pdfExtractSettings, format: targetFormat },
          (curr, total) => setProgressStatus({ current: curr, total })
        );

        const newResults = extracted.map((item) => {
          const pageName = generateOutputFilename(pdfFile.name, 'pdf-page', {
            pageNumber: item.pageNumber,
            targetFormat,
          });
          const pageUrl = createObjectUrl(item.blob);
          return {
            original: pdfFile,
            result: {
              blob: item.blob,
              objectUrl: pageUrl,
              filename: pageName,
              mimeType: item.blob.type,
              name: pageName,
              size: item.blob.size,
              type: item.blob.type,
              url: pageUrl,
              width: item.width,
              height: item.height,
            },
          };
        });

        if (newResults.length === 1) {
          setSingleResult(newResults[0].result);
        } else {
          setBatchResults(newResults);
        }
        setProcessing(false);
        return;
      }

      // 3. SINGLE OR BATCH IMAGE PROCESSING (CONVERT / COMPRESS / RESIZE)
      const resultsAccumulator: { original: File; result: ProcessingResult }[] = [];
      const failedAccumulator: { name: string; reason: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        if (cancelRef.current) {
          failedAccumulator.push({ name: 'Remaining files', reason: 'Processing cancelled by user' });
          break;
        }
        const detected = files[i];
        setProgressStatus({ current: i + 1, total: files.length });

        try {
          let outputBlob: Blob;
          let outputName = detected.name;

          if (selectedAction.category === 'compress') {
            if (detected.isPdf || detected.detectedFormat === 'pdf') {
              outputBlob = await compressPdf(detected.file, compressionSettings, (curr, total) => {
                setProgressStatus({ current: curr, total });
              });
            } else {
              outputBlob = await compressImage(detected.file, compressionSettings);
            }
            outputName = generateOutputFilename(detected.name, 'compressed', { mimeType: outputBlob.type });
          } else if (selectedAction.category === 'resize') {
            const ext = getFileExtension(detected.name);
            outputBlob = await resizeImage(detected.file, resizeSettings, ext);
            outputName = generateOutputFilename(detected.name, 'resized', { mimeType: outputBlob.type });
          } else {
            // Convert format
            const targetFormat = selectedAction.targetFormat || 'webp';
            if (detected.detectedFormat === 'heic') {
              outputBlob = await convertHeic(detected.file, targetFormat);
            } else {
              outputBlob = await convertImage(detected.file, targetFormat);
            }
            outputName = generateOutputFilename(detected.name, targetFormat);
          }

          const url = createObjectUrl(outputBlob);
          const res: ProcessingResult = {
            blob: outputBlob,
            objectUrl: url,
            filename: outputName,
            mimeType: outputBlob.type,
            name: outputName,
            size: outputBlob.size,
            type: outputBlob.type,
            url,
          };

          resultsAccumulator.push({ original: detected.file, result: res });
        } catch (err) {
          console.error(`Failed to process ${detected.name}:`, err);
          failedAccumulator.push({ name: detected.name, reason: 'Failed during encoding' });
        }
      }

      setFailedFiles(failedAccumulator);

      if (resultsAccumulator.length === 1 && files.length === 1) {
        setSingleResult(resultsAccumulator[0].result);
      } else if (resultsAccumulator.length > 0) {
        setBatchResults(resultsAccumulator);
      } else {
        setGeneralError('Could not process the selected files. Please verify format compatibility.');
      }
    } catch (err) {
      console.error('Fatal execution error:', err);
      setGeneralError('An unexpected error occurred during processing.');
    } finally {
      setProcessing(false);
      setProgressStatus(null);
    }
  };

  const resetAll = () => {
    files.forEach((f) => {
      if (f.previewUrl) revokeObjectUrl(f.previewUrl);
    });
    if (singleResult?.objectUrl) revokeObjectUrl(singleResult.objectUrl);
    else if (singleResult?.url) revokeObjectUrl(singleResult.url);
    batchResults.forEach((b) => {
      if (b.result.objectUrl) revokeObjectUrl(b.result.objectUrl);
      else if (b.result.url) revokeObjectUrl(b.result.url);
    });
    setSingleResult(null);
    setBatchResults([]);
    setFailedFiles([]);
    setGeneralError(null);
    onReset();
  };

  const backToSettings = () => {
    setSingleResult(null);
    setBatchResults([]);
  };

  // Render result screen if completed
  if (singleResult) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <ResultCard
          originalSize={files[0].size}
          resultSize={singleResult.size}
          resultBlob={singleResult.blob}
          resultName={singleResult.filename || singleResult.name}
          objectUrl={singleResult.objectUrl}
          filename={singleResult.filename}
          onReset={resetAll}
          onAdjust={backToSettings}
        />
      </div>
    );
  }

  if (batchResults.length > 0) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <BatchResult results={batchResults} onReset={resetAll} />

        {/* Failed items notice (Rule 19: Preserve successful results if one batch item fails) */}
        {failedFiles.length > 0 && (
          <div className="card-panel" style={{ marginTop: '14px', padding: '14px 18px', backgroundColor: 'var(--bg-block-row)', borderColor: 'var(--border-block-row)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.8125rem', fontWeight: 600 }}>
              <AlertCircle style={{ width: 16, height: 16 }} />
              <span>{failedFiles.length} file(s) could not be processed:</span>
            </div>
            <ul style={{ marginTop: '6px', paddingLeft: '24px', fontSize: '0.75rem', color: 'var(--text-sub)' }}>
              {failedFiles.map((f, i) => (
                <li key={i}>{f.name} ({f.reason})</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const formatSummaryList = Object.entries(summary.formatCounts)
    .map(([fmt, count]) => `${fmt.toUpperCase()} × ${count}`)
    .join('  ·  ');

  return (
    <div className="animate-slide-up" style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* File Detection Summary Header */}
      <div className="card-panel" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-blue)',
              flexShrink: 0,
            }}>
              {files.length === 1 && files[0].previewUrl ? (
                <img src={files[0].previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px', borderRadius: 'var(--radius-md)' }} />
              ) : files.length === 1 && files[0].isPdf ? (
                <FileText style={{ width: 22, height: 22 }} />
              ) : files.length === 1 && files[0].isPptx ? (
                <Presentation style={{ width: 22, height: 22, color: '#f97316' }} />
              ) : (
                <Layers style={{ width: 22, height: 22 }} />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {files.length === 1 ? files[0].name : `${files.length} Files Selected`}
                </h2>
                <span className="badge badge-protection" style={{ fontSize: '0.6875rem' }}>
                  ✓ Detected locally
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '2px' }}>
                {files.length === 1 ? (
                  <>
                    <strong style={{ color: 'var(--text-main)' }}>{files[0].detectedFormat.toUpperCase()}</strong>
                    {' · '}{formatFileSize(files[0].size)}
                    {files[0].width && files[0].height && ` · ${files[0].width} × ${files[0].height}px`}
                    {files[0].pageCount && ` · ${files[0].pageCount} ${files[0].isPptx ? (files[0].pageCount === 1 ? 'slide' : 'slides') : 'pages'}`}
                  </>
                ) : (
                  <>
                    {formatFileSize(summary.totalSize)} total · {formatSummaryList}
                  </>
                )}
              </p>
            </div>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={resetAll} style={{ fontSize: '0.75rem' }}>
            Change file(s)
          </button>
        </div>
      </div>

      {/* Action Selection: "What would you like to do?" */}
      <div className="card-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              What would you like to do?
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Compatible actions ranked for this format
            </p>
          </div>
          <div className="badge badge-idle" style={{ fontSize: '0.6875rem' }}>
            100% In-Browser
          </div>
        </div>

        {/* Primary Ranked Actions Grid */}
        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {resolution.primaryActions.map((action) => {
            const isSelected = selectedAction?.id === action.id;
            const Icon = getActionIcon(action.iconName);

            return (
              <div
                key={action.id}
                onClick={() => setSelectedAction(action)}
                role="button"
                tabIndex={0}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--bg-nav-active)' : 'var(--bg-app)',
                  border: `1px solid ${isSelected ? 'var(--brand-blue)' : 'var(--border-card)'}`,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  boxShadow: isSelected ? '0 0 0 1px var(--brand-blue)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon style={{ width: 16, height: 16, color: isSelected ? 'var(--brand-blue)' : 'var(--text-sub)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {action.title}
                    </span>
                  </div>
                  {action.badge && (
                    <span className="badge badge-protection" style={{ fontSize: '0.625rem', padding: '2px 8px' }}>
                      {action.badge}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.4, paddingLeft: '24px' }}>
                  {action.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        {/* "More options →" Accordion */}
        {resolution.moreOptions.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              style={{ fontSize: '0.75rem', color: 'var(--text-dim)', padding: '4px 8px' }}
            >
              <span>{showMoreOptions ? 'Less options' : 'More options'}</span>
              {showMoreOptions ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
            </button>

            {showMoreOptions && (
              <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginTop: '10px' }}>
                {resolution.moreOptions.map((action) => {
                  const isSelected = selectedAction?.id === action.id;
                  const Icon = getActionIcon(action.iconName);

                  return (
                    <div
                      key={action.id}
                      onClick={() => setSelectedAction(action)}
                      role="button"
                      tabIndex={0}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--bg-nav-active)' : 'var(--bg-app)',
                        border: `1px solid ${isSelected ? 'var(--brand-blue)' : 'var(--border-card)'}`,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon style={{ width: 15, height: 15, color: isSelected ? 'var(--brand-blue)' : 'var(--text-sub)' }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {action.title}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-sub)', marginTop: '2px', paddingLeft: '23px' }}>
                        {action.subtitle}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Action Settings & Execution Area */}
      {selectedAction && (
        <div className="card-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Configure {selectedAction.title}
            </h4>
            <span className="badge badge-idle" style={{ fontSize: '0.6875rem' }}>
              Step 2 of 2
            </span>
          </div>

          {/* Conditional Controls by Action Category */}
          {selectedAction.category === 'compress' && (
            <CompressionControls settings={compressionSettings} onChange={setCompressionSettings} />
          )}

          {selectedAction.category === 'resize' && (
            <ResizeControls
              settings={resizeSettings}
              onChange={setResizeSettings}
              originalWidth={files[0].width}
              originalHeight={files[0].height}
            />
          )}

          {(selectedAction.category === 'pdf' && !files[0].isPdf) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '6px' }}>
                    Page Size
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['a4', 'letter', 'legal'] as const).map((s) => (
                      <button
                        key={s}
                        className={`btn btn-sm ${pdfSettings.pageSize === s ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPdfSettings((p) => ({ ...p, pageSize: s }))}
                        style={{ flex: 1, textTransform: 'uppercase' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '6px' }}>
                    Orientation
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['portrait', 'landscape', 'auto'] as const).map((o) => (
                      <button
                        key={o}
                        className={`btn btn-sm ${pdfSettings.orientation === o ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPdfSettings((p) => ({ ...p, orientation: o }))}
                        style={{ flex: 1, textTransform: 'capitalize' }}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '6px' }}>
                  Margin: {pdfSettings.margin} mm
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: 'None (0mm)', val: 0 },
                    { label: '5mm', val: 5 },
                    { label: '10mm', val: 10 },
                    { label: '20mm', val: 20 },
                  ].map((m) => (
                    <button
                      key={m.val}
                      className={`btn btn-sm ${pdfSettings.margin === m.val ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setPdfSettings((p) => ({ ...p, margin: m.val }))}
                      style={{ flex: 1 }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedAction.category === 'convert' && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-sub)' }}>
                Target output format:
              </span>
              <span className="badge badge-protection" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                .{selectedAction.targetFormat || 'webp'}
              </span>
            </div>
          )}

          {/* In-Flight Progress Bar */}
          {processing && progressStatus && (
            <div style={{ padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                <span>Processing locally...</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {progressStatus.current} of {progressStatus.total}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.round((progressStatus.current / (progressStatus.total || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Trigger Button */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleExecute}
              disabled={processing}
              style={{ flex: 1, gap: '8px' }}
            >
              {processing ? (
                <>
                  <Clock style={{ width: 18, height: 18, animation: 'spin 2s linear infinite' }} />
                  <span>Processing on device...</span>
                </>
              ) : (
                <>
                  <span>Run {selectedAction.title}</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>
            {processing && (
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={handleCancel}
                style={{ color: '#ef4444', borderColor: '#ef4444' }}
              >
                Cancel
              </button>
            )}
          </div>

          {generalError && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-block-row)',
              border: '1px solid var(--border-block-row)',
              color: '#ef4444',
              fontSize: '0.8125rem',
            }}>
              {generalError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
