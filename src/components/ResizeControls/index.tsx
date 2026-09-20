// ===== RESIZE CONTROLS =====
// Styled with Inficy Universal Product Design Standard

import React from 'react';
import { Link2, Unlink, Info } from 'lucide-react';
import type { ResizeSettings } from '@/types';
import { BOUNDING_BOX_PRESETS, fitDimensionsInsideBoundingBox } from '@/utils';

interface ResizeControlsProps {
  settings: ResizeSettings;
  originalWidth?: number;
  originalHeight?: number;
  onChange: (settings: ResizeSettings) => void;
}

export const ResizeControls: React.FC<ResizeControlsProps> = ({
  settings,
  originalWidth,
  originalHeight,
  onChange,
}) => {
  const aspectRatio = originalWidth && originalHeight ? originalWidth / originalHeight : 1;

  const handleWidthChange = (w: number) => {
    if (settings.lockAspectRatio && w > 0) {
      onChange({ ...settings, width: w, height: Math.round(w / aspectRatio), preset: undefined });
    } else {
      onChange({ ...settings, width: w, preset: undefined });
    }
  };

  const handleHeightChange = (h: number) => {
    if (settings.lockAspectRatio && h > 0) {
      onChange({ ...settings, height: h, width: Math.round(h * aspectRatio), preset: undefined });
    } else {
      onChange({ ...settings, height: h, preset: undefined });
    }
  };

  const handleBoundingBoxPreset = (presetId: string, maxWidth: number, maxHeight: number) => {
    const origW = originalWidth || settings.width || maxWidth;
    const origH = originalHeight || settings.height || maxHeight;
    const { width, height } = fitDimensionsInsideBoundingBox(origW, origH, maxWidth, maxHeight, true);
    onChange({
      ...settings,
      width,
      height,
      lockAspectRatio: true,
      preset: presetId,
    });
  };

  const handlePercentageScale = (percent: number) => {
    const origW = originalWidth || settings.width;
    const origH = originalHeight || settings.height;
    if (origW && origH) {
      const scale = percent / 100;
      const w = Math.max(1, Math.round(origW * scale));
      const h = Math.max(1, Math.round(origH * scale));
      onChange({
        ...settings,
        width: w,
        height: h,
        lockAspectRatio: true,
        preset: `${percent}%`,
      });
    }
  };

  const handleResetOriginal = () => {
    if (originalWidth && originalHeight) {
      onChange({
        ...settings,
        width: originalWidth,
        height: originalHeight,
        lockAspectRatio: true,
        preset: 'original',
      });
    }
  };

  // Check current scale factor relative to original
  const currentScale = originalWidth && settings.width
    ? (settings.width / originalWidth).toFixed(2)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Original dimensions indicator */}
      {originalWidth && originalHeight && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8125rem',
          color: 'var(--text-sub)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <span>Original Source: </span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {originalWidth} × {originalHeight} px
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '6px' }}>
              ({originalWidth >= originalHeight ? 'Landscape' : 'Portrait'} · {(originalWidth / originalHeight).toFixed(2)}:1)
            </span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleResetOriginal}
            style={{ fontSize: '0.6875rem', padding: '3px 8px' }}
          >
            Reset 1:1
          </button>
        </div>
      )}

      {/* Percentage Scale Presets */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)' }}>
            Quick Percentage Scaling
          </label>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
            Instant proportional scale
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[25, 50, 75, 150, 200].map((pct) => {
            const isSelected = settings.preset === `${pct}%`;
            return (
              <button
                key={pct}
                type="button"
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handlePercentageScale(pct)}
              >
                {pct}%
              </button>
            );
          })}
        </div>
      </div>

      {/* Proportional Presets */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)' }}>
            Proportional Target Presets
          </label>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
            Fit target box · Preserves aspect ratio
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {BOUNDING_BOX_PRESETS.map((p) => {
            const isSelected = settings.preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleBoundingBoxPreset(p.id, p.maxWidth, p.maxHeight)}
                title={p.description}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        {settings.preset && originalWidth && originalHeight && settings.width === originalWidth && settings.height === originalHeight && (
          <div style={{
            marginTop: '8px',
            fontSize: '0.75rem',
            color: 'var(--badge-green-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Info style={{ width: 13, height: 13 }} />
            <span>
              Image is already within the {settings.preset} limit ({settings.width} × {settings.height} px). Original dimensions preserved.
            </span>
          </div>
        )}
        {currentScale && Number(currentScale) < 1 && (
          <div style={{
            marginTop: '8px',
            fontSize: '0.75rem',
            color: 'var(--badge-yellow-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Info style={{ width: 13, height: 13 }} />
            <span>
              Reducing pixel dimensions to {settings.width} × {settings.height} px ({currentScale}×; preserves aspect ratio).
            </span>
          </div>
        )}
        {!settings.preset && currentScale && Number(currentScale) > 1 && (
          <div style={{
            marginTop: '8px',
            fontSize: '0.75rem',
            color: 'var(--brand-blue)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Info style={{ width: 13, height: 13 }} />
            <span>
              Resize image to {settings.width} × {settings.height} px ({currentScale}×). Pixel resizing does not add new image detail.
            </span>
          </div>
        )}
      </div>

      {/* Custom dimensions */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '8px' }}>
          Custom Dimensions
        </label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
              Width (px)
            </label>
            <input
              type="number"
              className="input"
              value={settings.width || ''}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              min={1}
              max={10000}
              placeholder="Width"
              aria-label="Width in pixels"
            />
          </div>

          {/* Aspect ratio lock toggle */}
          <button
            className={`btn-icon ${settings.lockAspectRatio ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onChange({ ...settings, lockAspectRatio: !settings.lockAspectRatio })}
            aria-label={settings.lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            title={settings.lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
            style={{
              marginTop: '18px',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              border: settings.lockAspectRatio ? 'none' : '1px solid var(--border-card)',
            }}
          >
            {settings.lockAspectRatio ? (
              <Link2 style={{ width: 16, height: 16 }} />
            ) : (
              <Unlink style={{ width: 16, height: 16 }} />
            )}
          </button>

          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
              Height (px)
            </label>
            <input
              type="number"
              className="input"
              value={settings.height || ''}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              min={1}
              max={10000}
              placeholder="Height"
              aria-label="Height in pixels"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
