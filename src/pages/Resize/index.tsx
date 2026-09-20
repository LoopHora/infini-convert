// ===== RESIZE & CROP PAGE =====
// Styled with Inficy Universal Product Design Standard
// Supports both proportional/custom dimension resizing and interactive draggable freeform cropping.

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sliders, ShieldCheck, Clock, Crop, Layers } from 'lucide-react';
import { PageWrapper } from '@/components/Layout';
import { FileDropzone } from '@/components/FileDropzone';
import { FileList } from '@/components/FileList';
import { ResizeControls } from '@/components/ResizeControls';
import { ImageCropPreview } from '@/components/ImageCrop';
import { ResultCard } from '@/components/ResultCard';
import { BatchResult } from '@/components/BatchResult';
import { resizeImage, cropImage, isHeicFormat, decodeHeic, type CropArea } from '@/engine/codecs';
import {
  generateId,
  getFileExtension,
  createObjectUrl,
  revokeObjectUrl,
  getImageDimensions,
  generateOutputFilename,
  calculatePresetDimensions,
} from '@/utils';
import type { FileItem, ProcessingResult, ResizeSettings } from '@/types';

export const ResizePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [mode, setMode] = useState<'resize' | 'crop'>('resize');
  const [settings, setSettings] = useState<ResizeSettings>({
    width: 0,
    height: 0,
    lockAspectRatio: true,
  });
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ original: File; result: ProcessingResult }[]>([]);
  const [firstFileDimensions, setFirstFileDimensions] = useState<{ width: number; height: number } | null>(null);

  // Initialize mode from URL if requested
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'crop') {
      setMode('crop');
    }
  }, [searchParams]);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    const items: FileItem[] = [];
    let initialDims: { width: number; height: number } | null = null;

    for (const file of newFiles) {
      let width: number | undefined;
      let height: number | undefined;
      try {
        let source: File | Blob = file;
        if (isHeicFormat(file)) {
          try {
            source = await decodeHeic(file);
          } catch {
            // fallback
          }
        }
        const dims = await getImageDimensions(source);
        width = dims.width;
        height = dims.height;
        if (!initialDims) {
          initialDims = dims;
        }
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

    if (initialDims && (!firstFileDimensions || files.length === 0)) {
      setFirstFileDimensions(initialDims);
      setCropArea({ x: 0, y: 0, width: initialDims.width, height: initialDims.height });

      const requestedPreset = searchParams.get('preset');
      if (requestedPreset) {
        const calculated = calculatePresetDimensions(initialDims.width, initialDims.height, requestedPreset, true);
        setSettings({
          width: calculated.width,
          height: calculated.height,
          lockAspectRatio: true,
          preset: requestedPreset,
        });
      } else {
        setSettings({
          width: initialDims.width,
          height: initialDims.height,
          lockAspectRatio: true,
        });
      }
    }

    setFiles((prev) => {
      const updated = [...prev, ...items];
      if (prev.length === 0 && updated.length > 0) {
        setActiveFileIndex(0);
      }
      return updated;
    });
    setResults([]);
  }, [firstFileDimensions, files.length, searchParams]);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const remaining = prev.filter((f) => f.id !== id);
      if (remaining.length === 0) {
        setFirstFileDimensions(null);
        setSettings({ width: 0, height: 0, lockAspectRatio: true });
        setCropArea({ x: 0, y: 0, width: 0, height: 0 });
        setActiveFileIndex(0);
      } else {
        setActiveFileIndex((curr) => (curr >= remaining.length ? remaining.length - 1 : curr));
        const active = remaining[0];
        if (active?.width && active?.height) {
          setFirstFileDimensions({ width: active.width, height: active.height });
          setSettings((s) => ({
            ...s,
            width: active.width!,
            height: active.height!,
          }));
          setCropArea({ x: 0, y: 0, width: active.width, height: active.height });
        }
      }
      return remaining;
    });
  };

  const clearFiles = () => {
    setFiles([]);
    setResults([]);
    setFirstFileDimensions(null);
    setSettings({ width: 0, height: 0, lockAspectRatio: true });
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
    setActiveFileIndex(0);
  };

  // Switch active preview image when multiple files are loaded
  const handleSelectActiveFile = (index: number) => {
    if (index < 0 || index >= files.length) return;
    setActiveFileIndex(index);
    const item = files[index];
    if (item.width && item.height) {
      setCropArea({ x: 0, y: 0, width: item.width, height: item.height });
      if (mode === 'resize') {
        setSettings((s) => ({
          ...s,
          width: item.width!,
          height: item.height!,
        }));
      }
    }
  };

  const handleResize = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    const newResults: { original: File; result: ProcessingResult }[] = [];

    for (const item of files) {
      try {
        setFiles((prev) =>
          prev.map((f) => f.id === item.id ? { ...f, status: 'processing' as const, progress: 50 } : f)
        );

        const ext = getFileExtension(item.name);
        const blob = await resizeImage(item.file, settings, ext);
        const url = createObjectUrl(blob);

        let finalWidth = settings.width;
        let finalHeight = settings.height;
        try {
          const dims = await getImageDimensions(blob);
          finalWidth = dims.width;
          finalHeight = dims.height;
        } catch {
          // fallback
        }

        const resultName = generateOutputFilename(item.name, 'resized', { mimeType: blob.type });
        const result: ProcessingResult = {
          blob,
          objectUrl: url,
          filename: resultName,
          mimeType: blob.type,
          name: resultName,
          size: blob.size,
          type: blob.type,
          url,
          width: finalWidth,
          height: finalHeight,
        };

        newResults.push({ original: item.file, result });

        setFiles((prev) =>
          prev.map((f) => f.id === item.id ? { ...f, status: 'complete' as const, progress: 100, result } : f)
        );
      } catch (err) {
        console.error('Resize failed for file:', item.name, err);
        setFiles((prev) =>
          prev.map((f) => f.id === item.id ? { ...f, status: 'error' as const, error: err instanceof Error ? err.message : 'Resize failed' } : f)
        );
      }
    }

    setResults(newResults);
    setProcessing(false);
  };

  const handleCrop = async () => {
    if (files.length === 0) return;
    const targetItem = files[activeFileIndex] || files[0];
    if (!targetItem) return;

    setProcessing(true);
    try {
      setFiles((prev) =>
        prev.map((f) => f.id === targetItem.id ? { ...f, status: 'processing' as const, progress: 50 } : f)
      );

      const ext = getFileExtension(targetItem.name);
      const blob = await cropImage(targetItem.file, cropArea, ext);
      const url = createObjectUrl(blob);

      let finalWidth = Math.round(cropArea.width);
      let finalHeight = Math.round(cropArea.height);
      try {
        const dims = await getImageDimensions(blob);
        finalWidth = dims.width;
        finalHeight = dims.height;
      } catch {
        // fallback
      }

      const resultName = generateOutputFilename(targetItem.name, 'cropped', { mimeType: blob.type });
      const result: ProcessingResult = {
        blob,
        objectUrl: url,
        filename: resultName,
        mimeType: blob.type,
        name: resultName,
        size: blob.size,
        type: blob.type,
        url,
        width: finalWidth,
        height: finalHeight,
      };

      setFiles((prev) =>
        prev.map((f) => f.id === targetItem.id ? { ...f, status: 'complete' as const, progress: 100, result } : f)
      );

      setResults([{ original: targetItem.file, result }]);
    } catch (err) {
      console.error('Crop failed for file:', targetItem.name, err);
      setFiles((prev) =>
        prev.map((f) => f.id === targetItem.id ? { ...f, status: 'error' as const, error: err instanceof Error ? err.message : 'Crop failed' } : f)
      );
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    results.forEach((r) => {
      if (r.result.objectUrl) revokeObjectUrl(r.result.objectUrl);
      else if (r.result.url) revokeObjectUrl(r.result.url);
    });
    setFiles([]);
    setResults([]);
    setFirstFileDimensions(null);
    setSettings({ width: 0, height: 0, lockAspectRatio: true });
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
    setActiveFileIndex(0);
  };

  const activeFileItem = files[activeFileIndex] || files[0];

  return (
    <PageWrapper
      title="Resize & Crop Image"
      description="Resize pixel dimensions or freely crop images with interactive draggable bounding box."
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="animate-fade-in" style={{ marginBottom: '24px' }}>
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
              color: '#818cf8',
            }}>
              {mode === 'crop' ? (
                <Crop style={{ width: 18, height: 18 }} />
              ) : (
                <Sliders style={{ width: 18, height: 18 }} />
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {mode === 'crop' ? 'Free Crop Image' : 'Resize Image'}
            </h1>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-sub)' }}>
            {mode === 'crop'
              ? 'Drag the interactive bounding box to crop any area of your image freely or with locked aspect presets.'
              : 'Change image pixel dimensions with custom controls or presets while preserving aspect ratio.'}
          </p>
          <div className="badge badge-protection" style={{ marginTop: '10px' }}>
            <ShieldCheck style={{ width: 13, height: 13 }} />
            100% Local In-Browser Canvas Processing
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
              accept={['jpg', 'jpeg', 'png', 'webp', 'bmp', 'heic', 'heif']}
              compact={files.length > 0}
            />

            <FileList files={files} onRemove={removeFile} onClear={clearFiles} />

            {files.length > 0 && activeFileItem && (
              <>
                {/* Multi-file selector pill strip if > 1 file */}
                {files.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      overflowX: 'auto',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers style={{ width: 13, height: 13 }} />
                      Active Image:
                    </span>
                    {files.map((f, i) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`btn btn-sm ${activeFileIndex === i ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleSelectActiveFile(i)}
                        style={{ fontSize: '0.6875rem', padding: '3px 8px', whiteSpace: 'nowrap' }}
                      >
                        {i + 1}. {f.name.length > 16 ? f.name.slice(0, 14) + '…' : f.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* LIVE PREVIEW & INTERACTIVE DRAGGABLE CROP COMPONENT */}
                <ImageCropPreview
                  file={activeFileItem.file}
                  mode={mode}
                  onModeChange={setMode}
                  cropArea={cropArea}
                  onCropChange={setCropArea}
                  originalWidth={activeFileItem.width || firstFileDimensions?.width}
                  originalHeight={activeFileItem.height || firstFileDimensions?.height}
                  resizeSettings={settings}
                />

                {/* RESIZE CONTROLS (Rendered when in 'resize' mode) */}
                {mode === 'resize' && (
                  <div className="card-panel" style={{ padding: '20px' }}>
                    <ResizeControls
                      settings={settings}
                      onChange={setSettings}
                      originalWidth={activeFileItem.width || firstFileDimensions?.width}
                      originalHeight={activeFileItem.height || firstFileDimensions?.height}
                    />
                  </div>
                )}

                {/* ACTION BUTTON */}
                {mode === 'crop' ? (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleCrop}
                    disabled={processing || !cropArea.width || !cropArea.height}
                    style={{ width: '100%', gap: '8px' }}
                  >
                    {processing ? (
                      <>
                        <Clock style={{ width: 18, height: 18, animation: 'spin 2s linear infinite' }} />
                        Cropping Image...
                      </>
                    ) : (
                      <>
                        <Crop style={{ width: 18, height: 18 }} />
                        Crop &amp; Download Selection ({Math.round(cropArea.width)} × {Math.round(cropArea.height)} px)
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleResize}
                    disabled={processing || (!settings.width && !settings.height)}
                    style={{ width: '100%', gap: '8px' }}
                  >
                    {processing ? (
                      <>
                        <Clock style={{ width: 18, height: 18, animation: 'spin 2s linear infinite' }} />
                        Resizing Image...
                      </>
                    ) : (
                      <>
                        <Sliders style={{ width: 18, height: 18 }} />
                        Resize {files.length > 1 ? `${files.length} Files` : 'File'}
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
