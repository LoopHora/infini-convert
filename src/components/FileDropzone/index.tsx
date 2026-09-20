// ===== FILE DROPZONE =====
// Styled with Inficy Universal Product Design Standard

import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';

interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  maxSize?: number; // bytes
  disabled?: boolean;
  compact?: boolean;
  allowAllTypes?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFiles,
  accept = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic', 'heif', 'bmp', 'tiff', 'tif', 'gif', 'pdf'],
  multiple = true,
  maxSize = 100 * 1024 * 1024, // 100MB
  disabled = false,
  compact = false,
  allowAllTypes = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptMime = allowAllTypes
    ? undefined
    : accept
        .map((ext) => {
          const mimes: Record<string, string> = {
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
            webp: 'image/webp', avif: 'image/avif', heic: 'image/heic',
            heif: 'image/heif', bmp: 'image/bmp', tiff: 'image/tiff',
            tif: 'image/tiff', gif: 'image/gif', pdf: 'application/pdf',
          };
          return mimes[ext] || '';
        })
        .filter(Boolean)
        .join(',');

  const validateFiles = useCallback(
    (fileList: FileList | File[]): File[] => {
      const files = Array.from(fileList);
      const valid: File[] = [];
      setError(null);

      for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const hasExt = file.name.includes('.');
        if (!allowAllTypes && hasExt && !accept.includes(ext)) {
          setError(`Unsupported format: .${ext}`);
          continue;
        }
        if (file.size > maxSize) {
          setError(`File exceeds limit: ${file.name} (max ${Math.round(maxSize / 1024 / 1024)}MB)`);
          continue;
        }
        if (!allowAllTypes && file.size === 0) {
          setError(`Empty file: ${file.name}`);
          continue;
        }
        valid.push(file);
      }
      return valid;
    },
    [accept, maxSize, allowAllTypes]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;
      const valid = validateFiles(e.dataTransfer.files);
      if (valid.length) onFiles(valid);
    },
    [disabled, validateFiles, onFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const valid = validateFiles(e.target.files);
        if (valid.length) onFiles(valid);
      }
      e.target.value = '';
    },
    [validateFiles, onFiles]
  );

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div
      className={`dropzone ${isDragOver ? 'drag-over' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Drop files here or click to select"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      style={compact ? { padding: '24px 16px' } : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptMime}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? '8px' : '14px' }}>
        <div style={{
          width: compact ? 40 : 52,
          height: compact ? 40 : 52,
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--brand-blue)',
          transition: 'all var(--transition-base)',
        }}>
          <UploadCloud style={{ width: compact ? 20 : 26, height: compact ? 20 : 26 }} />
        </div>

        {!compact && (
          <div>
            <p style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '3px' }}>
              Drop files here
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-sub)' }}>
              or click to browse from device
            </p>
          </div>
        )}

        {compact && (
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Drop additional files or click to browse
          </p>
        )}

        {!compact && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
            {accept.slice(0, 8).map((ext) => (
              <span key={ext} className="badge badge-idle" style={{ fontSize: '0.6875rem' }}>
                .{ext}
              </span>
            ))}
            {accept.length > 8 && (
              <span className="badge badge-idle" style={{ fontSize: '0.6875rem' }}>
                +{accept.length - 8} more
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#ef4444',
          fontSize: '0.8125rem',
          fontWeight: 500,
        }}>
          <AlertCircle style={{ width: 14, height: 14 }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
