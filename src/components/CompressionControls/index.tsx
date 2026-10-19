// ===== COMPRESSION CONTROLS =====
// Styled with Inficy Universal Product Design Standard

import React from 'react';
import { Sparkles, Scale, Box, Sliders } from 'lucide-react';
import type { CompressionSettings } from '@/types';
import { TARGET_SIZES } from '@/types';
import { formatFileSize } from '@/utils';

interface CompressionControlsProps {
  settings: CompressionSettings;
  onChange: (settings: CompressionSettings) => void;
}

export const CompressionControls: React.FC<CompressionControlsProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Mode selector */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '8px' }}>
          Compression Mode
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['preset', 'custom', 'target'] as const).map((mode) => (
            <button
              key={mode}
              className={`btn btn-sm ${settings.mode === mode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onChange({ ...settings, mode })}
              style={{ flex: 1, textTransform: 'capitalize' }}
            >
              {mode === 'target' ? 'Target Size' : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Preset mode */}
      {settings.mode === 'preset' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '8px' }}>
            Quality Preset
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: '4k', label: '4K Ultra-HD', icon: Sparkles },
              { id: 'best', label: 'Best Quality', icon: Sliders },
              { id: 'balanced', label: 'Balanced', icon: Scale },
              { id: 'smallest', label: 'Smallest Size', icon: Box },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`btn btn-sm ${settings.preset === id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onChange({ ...settings, preset: id as '4k' | 'best' | 'balanced' | 'smallest' })}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minWidth: '100px' }}
              >
                <Icon style={{ width: 14, height: 14 }} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom mode */}
      {settings.mode === 'custom' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)' }}>
              Quality Slider
            </label>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-card)',
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
            }}>
              {settings.quality}%
            </span>
          </div>
          <input
            type="range"
            className="slider"
            min={5}
            max={100}
            value={settings.quality}
            onChange={(e) => onChange({ ...settings, quality: Number(e.target.value) })}
            aria-label="Image quality"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Maximum Compression</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>Highest Quality</span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '8px' }}>
              Resolution & Sharpness Tier
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: '4k', label: '4K Ultra-HD (300 DPI)' },
                { id: 'high', label: '2K High (200 DPI)' },
                { id: 'standard', label: 'Standard (150 DPI)' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`btn btn-sm ${(settings.resolution || (settings.quality >= 90 ? '4k' : 'high')) === id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => onChange({ ...settings, resolution: id as '4k' | 'high' | 'standard' })}
                  style={{ flex: 1, fontSize: '0.75rem' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Target size mode */}
      {settings.mode === 'target' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '8px' }}>
            Target File Size
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {TARGET_SIZES.map((ts) => (
              <button
                key={ts.value}
                className={`btn btn-sm ${settings.targetSize === ts.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onChange({ ...settings, targetSize: ts.value })}
              >
                {ts.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
              Custom Target Size (KB)
            </label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 300"
              min={10}
              max={1024 * 1024}
              value={settings.targetSize ? Math.round(settings.targetSize / 1024) : ''}
              onChange={(e) => {
                const kb = Number(e.target.value);
                if (kb > 0) onChange({ ...settings, targetSize: kb * 1024 });
              }}
              style={{ maxWidth: '160px' }}
              aria-label="Custom target size in KB"
            />
          </div>
          {settings.targetSize && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
              Algorithm will iteratively optimize quality to stay under ~{formatFileSize(settings.targetSize)}.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
