// ===== INTERACTIVE IMAGE CROP & PREVIEW COMPONENT =====
// High-precision interactive image preview with freeform draggable crop box,
// 8 resize handles, rule-of-thirds grid, aspect ratio presets, and natural resolution mapping.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crop,
  Maximize2,
  RotateCcw,
  Sliders,
  Move,
  Check,
  Sparkles,
} from 'lucide-react';
import type { CropArea } from '@/engine/codecs';
import type { ResizeSettings } from '@/types';
import { isHeicFormat, decodeHeic } from '@/engine/codecs';

export interface ImageCropPreviewProps {
  file: File;
  mode: 'resize' | 'crop';
  onModeChange: (mode: 'resize' | 'crop') => void;
  cropArea: CropArea;
  onCropChange: (area: CropArea) => void;
  originalWidth?: number;
  originalHeight?: number;
  resizeSettings?: ResizeSettings;
}

export type AspectRatioOption = 'free' | '1:1' | '16:9' | '4:3' | '3:2' | '9:16' | 'original';

interface AspectRatioItem {
  id: AspectRatioOption;
  label: string;
  ratio?: number; // width / height
}

const ASPECT_RATIOS: AspectRatioItem[] = [
  { id: 'free', label: 'Free Crop' },
  { id: '1:1', label: '1:1 Square', ratio: 1 },
  { id: '16:9', label: '16:9 Widescreen', ratio: 16 / 9 },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3 },
  { id: '3:2', label: '3:2 Photo', ratio: 3 / 2 },
  { id: '9:16', label: '9:16 Reel / Story', ratio: 9 / 16 },
  { id: 'original', label: 'Original' },
];

export const ImageCropPreview: React.FC<ImageCropPreviewProps> = ({
  file,
  mode,
  onModeChange,
  cropArea,
  onCropChange,
  originalWidth,
  originalHeight,
  resizeSettings,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [naturalDims, setNaturalDims] = useState<{ width: number; height: number }>({
    width: originalWidth || 800,
    height: originalHeight || 600,
  });
  const [aspectOption, setAspectOption] = useState<AspectRatioOption>('free');

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Rendered image element geometry relative to container
  const [renderedBounds, setRenderedBounds] = useState<{
    width: number;
    height: number;
    left: number;
    top: number;
  }>({ width: 0, height: 0, left: 0, top: 0 });

  // Drag interaction state
  const dragRef = useRef<{
    isDragging: boolean;
    handle: string; // 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
    startX: number;
    startY: number;
    startArea: CropArea;
    aspectRatio?: number;
  }>({
    isDragging: false,
    handle: '',
    startX: 0,
    startY: 0,
    startArea: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Load preview URL (handle HEIC automatically)
  useEffect(() => {
    let active = true;
    let urlToRevoke: string | null = null;

    const load = async () => {
      try {
        let blob: Blob = file;
        if (isHeicFormat(file)) {
          blob = await decodeHeic(file);
        }
        if (!active) return;
        const url = URL.createObjectURL(blob);
        urlToRevoke = url;
        setImageUrl(url);
      } catch (err) {
        console.warn('Failed to load image preview url:', err);
        const url = URL.createObjectURL(file);
        urlToRevoke = url;
        setImageUrl(url);
      }
    };

    load();

    return () => {
      active = false;
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [file]);

  // Update bounds when image loads or window resizes
  const updateRenderedBounds = useCallback(() => {
    const img = imageRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setRenderedBounds({
      width: imgRect.width,
      height: imgRect.height,
      left: imgRect.left - containerRect.left,
      top: imgRect.top - containerRect.top,
    });
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth || 800;
    const h = img.naturalHeight || 600;
    setNaturalDims({ width: w, height: h });

    // Initialize cropArea to full image if not set yet
    if (!cropArea.width || !cropArea.height) {
      onCropChange({ x: 0, y: 0, width: w, height: h });
    }

    updateRenderedBounds();
  };

  useEffect(() => {
    window.addEventListener('resize', updateRenderedBounds);
    return () => window.removeEventListener('resize', updateRenderedBounds);
  }, [updateRenderedBounds]);

  // Handle aspect ratio preset selection
  const applyAspectPreset = (opt: AspectRatioOption) => {
    setAspectOption(opt);
    const nw = naturalDims.width;
    const nh = naturalDims.height;
    if (!nw || !nh) return;

    if (opt === 'free') {
      return;
    }

    let targetRatio = 1;
    if (opt === 'original') {
      targetRatio = nw / nh;
    } else {
      const found = ASPECT_RATIOS.find((r) => r.id === opt);
      targetRatio = found?.ratio || 1;
    }

    // Calculate maximum centered rectangle that fits inside naturalDims
    let boxW: number;
    let boxH: number;

    if (nw / nh > targetRatio) {
      // Height-constrained
      boxH = nh;
      boxW = Math.round(nh * targetRatio);
    } else {
      // Width-constrained
      boxW = nw;
      boxH = Math.round(nw / targetRatio);
    }

    const boxX = Math.max(0, Math.round((nw - boxW) / 2));
    const boxY = Math.max(0, Math.round((nh - boxH) / 2));

    onCropChange({
      x: boxX,
      y: boxY,
      width: Math.min(nw, boxW),
      height: Math.min(nh, boxH),
    });
  };

  const handleResetCrop = () => {
    setAspectOption('free');
    onCropChange({
      x: 0,
      y: 0,
      width: naturalDims.width,
      height: naturalDims.height,
    });
  };

  const handleCenterCrop = () => {
    const nw = naturalDims.width;
    const nh = naturalDims.height;
    const w = cropArea.width;
    const h = cropArea.height;
    const newX = Math.max(0, Math.round((nw - w) / 2));
    const newY = Math.max(0, Math.round((nh - h) / 2));
    onCropChange({ ...cropArea, x: newX, y: newY });
  };

  // Convert natural crop coordinates to screen coordinates
  const scale = renderedBounds.width > 0 && naturalDims.width > 0
    ? renderedBounds.width / naturalDims.width
    : 1;

  const screenX = renderedBounds.left + cropArea.x * scale;
  const screenY = renderedBounds.top + cropArea.y * scale;
  const screenW = Math.max(1, cropArea.width * scale);
  const screenH = Math.max(1, cropArea.height * scale);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    let activeRatio: number | undefined;
    if (aspectOption === 'original') {
      activeRatio = naturalDims.width / naturalDims.height;
    } else if (aspectOption !== 'free') {
      const item = ASPECT_RATIOS.find((r) => r.id === aspectOption);
      activeRatio = item?.ratio;
    }

    dragRef.current = {
      isDragging: true,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startArea: { ...cropArea },
      aspectRatio: activeRatio,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging) return;
    e.preventDefault();

    const { handle, startX, startY, startArea, aspectRatio } = dragRef.current;
    const nw = naturalDims.width;
    const nh = naturalDims.height;

    // Convert display pixels to natural image pixels
    const deltaDisplayX = e.clientX - startX;
    const deltaDisplayY = e.clientY - startY;
    const deltaNatX = scale > 0 ? deltaDisplayX / scale : 0;
    const deltaNatY = scale > 0 ? deltaDisplayY / scale : 0;

    const MIN_SIZE = 24;

    if (handle === 'move') {
      let nextX = startArea.x + deltaNatX;
      let nextY = startArea.y + deltaNatY;

      // Clamp within natural bounds
      nextX = Math.max(0, Math.min(nw - startArea.width, nextX));
      nextY = Math.max(0, Math.min(nh - startArea.height, nextY));

      onCropChange({
        ...startArea,
        x: Math.round(nextX),
        y: Math.round(nextY),
      });
      return;
    }

    // Resizing with drag handles
    let left = startArea.x;
    let top = startArea.y;
    let right = startArea.x + startArea.width;
    let bottom = startArea.y + startArea.height;

    if (handle.includes('w')) {
      left = Math.min(right - MIN_SIZE, Math.max(0, startArea.x + deltaNatX));
    }
    if (handle.includes('e')) {
      right = Math.max(left + MIN_SIZE, Math.min(nw, startArea.x + startArea.width + deltaNatX));
    }
    if (handle.includes('n')) {
      top = Math.min(bottom - MIN_SIZE, Math.max(0, startArea.y + deltaNatY));
    }
    if (handle.includes('s')) {
      bottom = Math.max(top + MIN_SIZE, Math.min(nh, startArea.y + startArea.height + deltaNatY));
    }

    let w = right - left;
    let h = bottom - top;

    // If an aspect ratio is enforced, adjust dimensions
    if (aspectRatio) {
      if (handle === 'e' || handle === 'w') {
        h = w / aspectRatio;
        const cy = (top + bottom) / 2;
        top = Math.max(0, cy - h / 2);
        bottom = Math.min(nh, top + h);
        if (bottom === nh) top = Math.max(0, nh - h);
        w = (bottom - top) * aspectRatio;
      } else if (handle === 'n' || handle === 's') {
        w = h * aspectRatio;
        const cx = (left + right) / 2;
        left = Math.max(0, cx - w / 2);
        right = Math.min(nw, left + w);
        if (right === nw) left = Math.max(0, nw - w);
        h = (right - left) / aspectRatio;
      } else {
        // Corner handles: preserve aspect ratio using dominant delta
        const candidateH = w / aspectRatio;
        if (top + candidateH <= nh) {
          h = candidateH;
          if (handle.includes('n')) {
            top = bottom - h;
          } else {
            bottom = top + h;
          }
        } else {
          w = h * aspectRatio;
          if (handle.includes('w')) {
            left = right - w;
          } else {
            right = left + w;
          }
        }
      }
    }

    // Final safety clamps
    const finalX = Math.max(0, Math.min(nw - MIN_SIZE, Math.round(left)));
    const finalY = Math.max(0, Math.min(nh - MIN_SIZE, Math.round(top)));
    const finalW = Math.max(MIN_SIZE, Math.min(nw - finalX, Math.round(w)));
    const finalH = Math.max(MIN_SIZE, Math.min(nh - finalY, Math.round(h)));

    onCropChange({
      x: finalX,
      y: finalY,
      width: finalW,
      height: finalH,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    dragRef.current.isDragging = false;
  };

  // Compute aspect ratio description
  const cropRatioStr = cropArea.width && cropArea.height
    ? (cropArea.width / cropArea.height).toFixed(2) + ':1'
    : '';

  return (
    <div
      className="card-panel"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        overflow: 'hidden',
      }}
    >
      {/* Top Header & Mode Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-card)',
          paddingBottom: '12px',
        }}
      >
        {/* Mode Toggle Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-app)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'resize' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onModeChange('resize')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              gap: '6px',
            }}
          >
            <Sliders style={{ width: 15, height: 15 }} />
            Resize Dimensions
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'crop' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onModeChange('crop')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              gap: '6px',
            }}
          >
            <Crop style={{ width: 15, height: 15 }} />
            Free Crop
          </button>
        </div>

        {/* Live Info Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {mode === 'crop' ? (
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--brand-blue)',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles style={{ width: 12, height: 12 }} />
              Selection: {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px ({cropRatioStr})
            </div>
          ) : (
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-sub)',
                backgroundColor: 'var(--bg-app)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-card)',
              }}
            >
              Original: {naturalDims.width} × {naturalDims.height} px
              {resizeSettings?.width && resizeSettings.width !== naturalDims.width ? (
                <span style={{ color: 'var(--brand-primary)', marginLeft: '6px' }}>
                  → Target: {resizeSettings.width} × {resizeSettings.height} px
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Viewport Area */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '260px',
          maxHeight: '500px',
          backgroundColor: '#0a0a0c',
          backgroundImage:
            'linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          touchAction: 'none',
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {imageUrl ? (
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Preview source"
            onLoad={handleImageLoad}
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '480px',
              objectFit: 'contain',
              pointerEvents: 'none',
              borderRadius: 'var(--radius-sm)',
            }}
          />
        ) : (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Loading image preview...</div>
        )}

        {/* CROP OVERLAY (Active only when mode === 'crop' and image rendered) */}
        {mode === 'crop' && renderedBounds.width > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {/* SVG Dimmed Mask Outside Crop Area */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            >
              <path
                d={`M 0 0 H ${containerRef.current?.clientWidth || 1000} V ${containerRef.current?.clientHeight || 600} H 0 Z M ${screenX} ${screenY} v ${screenH} h ${screenW} v -${screenH} Z`}
                fill="rgba(0, 0, 0, 0.62)"
                fillRule="evenodd"
              />
            </svg>

            {/* Interactive Draggable Crop Box */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'move')}
              style={{
                position: 'absolute',
                left: `${screenX}px`,
                top: `${screenY}px`,
                width: `${screenW}px`,
                height: `${screenH}px`,
                border: '2px solid #38bdf8',
                boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.25)',
                cursor: 'move',
                pointerEvents: 'auto',
                boxSizing: 'border-box',
              }}
              title="Click and drag to reposition crop selection"
            >
              {/* Rule-of-Thirds Grid */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gridTemplateRows: '1fr 1fr 1fr',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
                <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
                <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)' }} />
                <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)' }} />
                <div />
              </div>

              {/* Move Indicator Icon in Center */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  opacity: 0.7,
                  color: '#ffffff',
                  display: screenW > 70 && screenH > 70 ? 'flex' : 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px',
                }}
              >
                <Move style={{ width: 14, height: 14 }} />
              </div>

              {/* 8 Resize Handles */}
              {[
                { id: 'nw', top: -7, left: -7, cursor: 'nwse-resize' },
                { id: 'n', top: -7, left: 'calc(50% - 7px)', cursor: 'ns-resize' },
                { id: 'ne', top: -7, right: -7, cursor: 'nesw-resize' },
                { id: 'e', top: 'calc(50% - 7px)', right: -7, cursor: 'ew-resize' },
                { id: 'se', bottom: -7, right: -7, cursor: 'nwse-resize' },
                { id: 's', bottom: -7, left: 'calc(50% - 7px)', cursor: 'ns-resize' },
                { id: 'sw', bottom: -7, left: -7, cursor: 'nesw-resize' },
                { id: 'w', top: 'calc(50% - 7px)', left: -7, cursor: 'ew-resize' },
              ].map((h) => (
                <div
                  key={h.id}
                  onPointerDown={(e) => handlePointerDown(e, h.id)}
                  style={{
                    position: 'absolute',
                    top: h.top !== undefined ? h.top : undefined,
                    bottom: h.bottom !== undefined ? h.bottom : undefined,
                    left: h.left !== undefined ? h.left : undefined,
                    right: h.right !== undefined ? h.right : undefined,
                    width: 14,
                    height: 14,
                    backgroundColor: '#ffffff',
                    border: '2px solid #0284c7',
                    borderRadius: '3px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                    cursor: h.cursor,
                    pointerEvents: 'auto',
                    zIndex: 10,
                  }}
                  title={`Drag ${h.id.toUpperCase()} handle to crop`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Crop Controls & Aspect Ratio Presets Toolbar (when in Crop mode) */}
      {mode === 'crop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)' }}>
              Crop Aspect Ratio:
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleCenterCrop}
                style={{ fontSize: '0.6875rem', padding: '3px 8px' }}
                title="Center crop rectangle"
              >
                Center
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleResetCrop}
                style={{ fontSize: '0.6875rem', padding: '3px 8px', gap: '4px' }}
                title="Reset to full image dimensions"
              >
                <RotateCcw style={{ width: 11, height: 11 }} />
                Full Image
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {ASPECT_RATIOS.map((item) => {
              const isSelected = aspectOption === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => applyAspectPreset(item.id)}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
