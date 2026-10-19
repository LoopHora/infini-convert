// ===== TYPES — Infini-Convert =====

export type ToolCategory = 'convert' | 'compress' | 'resize' | 'pdf' | 'powerpoint';

export interface ConversionTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  inputFormats: string[];
  outputFormats: string[];
  engine: string;
  processing: 'local';
  supportsBatch: boolean;
  icon: string;
  keywords: string[];
}

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  extension: string;
  width?: number;
  height?: number;
  preview?: string;
  status: ProcessingStatus;
  progress: number;
  result?: ProcessingResult;
  error?: string;
}

export type ProcessingStatus = 'idle' | 'processing' | 'complete' | 'error' | 'cancelled';

export interface ProcessingResult {
  blob: Blob;
  objectUrl: string;
  filename: string;
  mimeType: string;
  size: number;
  // Aliases for compatibility
  name?: string;
  type?: string;
  url?: string;
  width?: number;
  height?: number;
}

export interface CompressionSettings {
  mode: 'preset' | 'custom' | 'target';
  preset: '4k' | 'best' | 'balanced' | 'smallest';
  quality: number; // 0-100
  targetSize?: number; // bytes
  resolution?: 'standard' | 'high' | '4k'; // scale factor / resolution tier
}

export type PdfCompressionSettings = CompressionSettings;

export interface ResizeSettings {
  width: number;
  height: number;
  lockAspectRatio: boolean;
  preset?: string;
}

export interface PdfSettings {
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape' | 'auto';
  margin: number; // mm
  quality: number; // 0-100
}

export interface PdfToImageSettings {
  format: 'jpg' | 'png';
  quality: number;
  pages: 'all' | number[];
  scale: number;
}

// Page size dimensions in points (72 per inch)
export const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
} as const;

export const PRESET_QUALITIES: Record<CompressionSettings['preset'], number> = {
  '4k': 95,
  best: 90,
  balanced: 75,
  smallest: 45,
};

export const RESIZE_PRESETS = [
  { label: '640px', value: 640 },
  { label: '1080px', value: 1080 },
  { label: '1920px', value: 1920 },
  { label: '2560px', value: 2560 },
  { label: '3840px', value: 3840 },
] as const;

export const TARGET_SIZES = [
  { label: '100 KB', value: 100 * 1024 },
  { label: '200 KB', value: 200 * 1024 },
  { label: '500 KB', value: 500 * 1024 },
  { label: '1 MB', value: 1024 * 1024 },
  { label: '2 MB', value: 2 * 1024 * 1024 },
] as const;
