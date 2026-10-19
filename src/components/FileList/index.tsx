// ===== FILE LIST =====
// Styled with Inficy Universal Product Design Standard

import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, X, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { formatFileSize } from '@/utils';
import type { FileItem } from '@/types';

interface FileListProps {
  files: FileItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  showDimensions?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onRemove,
  onClear,
  onReorder,
  showDimensions = true,
}) => {
  if (files.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 2px',
      }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-sub)' }}>
          {files.length} file{files.length !== 1 ? 's' : ''} queued
        </span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onClear}
          aria-label="Clear all files"
          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
        >
          Clear all
        </button>
      </div>

      {/* File list container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
        {files.map((item, index) => (
          <FileListItem
            key={item.id}
            item={item}
            index={index}
            onRemove={onRemove}
            onReorder={onReorder}
            showDimensions={showDimensions}
            totalFiles={files.length}
          />
        ))}
      </div>
    </div>
  );
};

// ===== FILE LIST ITEM =====

interface FileListItemProps {
  item: FileItem;
  index: number;
  onRemove: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  showDimensions: boolean;
  totalFiles: number;
}

const FileListItem: React.FC<FileListItemProps> = ({
  item,
  index,
  onRemove,
  onReorder,
  showDimensions,
  totalFiles,
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (item.file.type.startsWith('image/')) {
      const url = URL.createObjectURL(item.file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [item.file]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-card)',
        transition: 'all var(--transition-fast)',
      }}
    >
      {/* Reorder handle */}
      {onReorder && totalFiles > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button
            className="btn-icon"
            onClick={() => index > 0 && onReorder(index, index - 1)}
            disabled={index === 0}
            aria-label="Move up"
            style={{ width: '20px', height: '20px', opacity: index === 0 ? 0.2 : 1 }}
          >
            <ChevronUp style={{ width: '12px', height: '12px' }} />
          </button>
          <button
            className="btn-icon"
            onClick={() => index < totalFiles - 1 && onReorder(index, index + 1)}
            disabled={index === totalFiles - 1}
            aria-label="Move down"
            style={{ width: '20px', height: '20px', opacity: index === totalFiles - 1 ? 0.2 : 1 }}
          >
            <ChevronDown style={{ width: '12px', height: '12px' }} />
          </button>
        </div>
      )}

      {/* Thumbnail */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--bg-input)',
        border: '1px solid var(--border-sub)',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {preview ? (
          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
        ) : (
          <FileText style={{ width: 16, height: 16, color: 'var(--text-dim)' }} />
        )}
      </div>

      {/* File info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {item.name}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
          {item.result ? (
            <span>
              <strong style={{ color: 'var(--badge-green-text)', fontWeight: 700 }}>{formatFileSize(item.result.size)}</strong>
              <span style={{ color: 'var(--text-dim)', marginLeft: '6px' }}>(original: {formatFileSize(item.size)})</span>
            </span>
          ) : (
            formatFileSize(item.size)
          )}
          {showDimensions && item.width && item.height && (
            <> · {item.width} × {item.height}</>
          )}
        </p>
      </div>

      {/* Status icon */}
      {item.status === 'processing' && (
        <Clock style={{ width: 16, height: 16, color: 'var(--brand-blue)', animation: 'spin 2s linear infinite' }} />
      )}
      {item.status === 'complete' && (
        <CheckCircle style={{ width: 16, height: 16, color: 'var(--badge-green-text)' }} />
      )}
      {item.status === 'error' && (
        <AlertCircle style={{ width: 16, height: 16, color: '#ef4444' }} />
      )}

      {/* Remove button */}
      <button
        className="btn-icon"
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.name}`}
        style={{ width: '24px', height: '24px' }}
      >
        <X style={{ width: '13px', height: '13px' }} />
      </button>
    </div>
  );
};
