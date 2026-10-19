// ===== CONVERSION REGISTRY =====
// Central source of truth for all tools in Infini-Convert

import { ConversionTool, ToolCategory } from '@/types';

export const tools: ConversionTool[] = [
  // ===== CONVERT =====
  {
    id: 'jpg-to-png',
    name: 'JPG to PNG',
    description: 'Convert JPG/JPEG images to PNG format locally.',
    category: 'convert',
    inputFormats: ['jpg', 'jpeg'],
    outputFormats: ['png'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '🖼️',
    keywords: ['jpg', 'jpeg', 'png', 'convert', 'image'],
  },
  {
    id: 'png-to-jpg',
    name: 'PNG to JPG',
    description: 'Convert PNG images to JPG format for smaller file sizes.',
    category: 'convert',
    inputFormats: ['png'],
    outputFormats: ['jpg'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '🖼️',
    keywords: ['png', 'jpg', 'jpeg', 'convert', 'image'],
  },
  {
    id: 'jpg-to-webp',
    name: 'JPG to WebP',
    description: 'Convert JPG images to WebP for modern web performance.',
    category: 'convert',
    inputFormats: ['jpg', 'jpeg'],
    outputFormats: ['webp'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '⚡',
    keywords: ['jpg', 'jpeg', 'webp', 'convert', 'web'],
  },
  {
    id: 'png-to-webp',
    name: 'PNG to WebP',
    description: 'Convert PNG images to WebP for smaller file sizes with transparency.',
    category: 'convert',
    inputFormats: ['png'],
    outputFormats: ['webp'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '⚡',
    keywords: ['png', 'webp', 'convert', 'web', 'transparency'],
  },
  {
    id: 'webp-to-jpg',
    name: 'WebP to JPG',
    description: 'Convert WebP images to JPG for broader compatibility.',
    category: 'convert',
    inputFormats: ['webp'],
    outputFormats: ['jpg'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '🖼️',
    keywords: ['webp', 'jpg', 'jpeg', 'convert'],
  },
  {
    id: 'webp-to-png',
    name: 'WebP to PNG',
    description: 'Convert WebP images to PNG format locally.',
    category: 'convert',
    inputFormats: ['webp'],
    outputFormats: ['png'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '🖼️',
    keywords: ['webp', 'png', 'convert', 'image-format'],
  },
  {
    id: 'jpg-to-avif',
    name: 'JPG to AVIF',
    description: 'Convert JPG images to AVIF for next-gen compression.',
    category: 'convert',
    inputFormats: ['jpg', 'jpeg'],
    outputFormats: ['avif'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '🚀',
    keywords: ['jpg', 'avif', 'convert', 'next-gen'],
  },
  {
    id: 'png-to-avif',
    name: 'PNG to AVIF',
    description: 'Convert PNG images to AVIF for next-gen compression.',
    category: 'convert',
    inputFormats: ['png'],
    outputFormats: ['avif'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '🚀',
    keywords: ['png', 'avif', 'convert', 'next-gen'],
  },
  {
    id: 'heic-to-jpg',
    name: 'HEIC to JPG',
    description: 'Convert Apple HEIC photos to universally compatible JPG.',
    category: 'convert',
    inputFormats: ['heic', 'heif'],
    outputFormats: ['jpg'],
    engine: 'heic',
    processing: 'local',
    supportsBatch: true,
    icon: '📱',
    keywords: ['heic', 'heif', 'jpg', 'apple', 'iphone', 'convert'],
  },
  {
    id: 'heic-to-png',
    name: 'HEIC to PNG',
    description: 'Convert Apple HEIC photos to PNG with full quality.',
    category: 'convert',
    inputFormats: ['heic', 'heif'],
    outputFormats: ['png'],
    engine: 'heic',
    processing: 'local',
    supportsBatch: true,
    icon: '📱',
    keywords: ['heic', 'heif', 'png', 'apple', 'iphone', 'convert'],
  },
  {
    id: 'heic-to-webp',
    name: 'HEIC to WebP',
    description: 'Convert Apple HEIC photos to modern, lightweight WebP.',
    category: 'convert',
    inputFormats: ['heic', 'heif'],
    outputFormats: ['webp'],
    engine: 'heic',
    processing: 'local',
    supportsBatch: true,
    icon: '📱',
    keywords: ['heic', 'heif', 'webp', 'apple', 'iphone', 'convert'],
  },
  {
    id: 'bmp-to-png',
    name: 'BMP to PNG',
    description: 'Convert BMP bitmap images to PNG.',
    category: 'convert',
    inputFormats: ['bmp'],
    outputFormats: ['png'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '🖼️',
    keywords: ['bmp', 'bitmap', 'png', 'convert'],
  },
  {
    id: 'bmp-to-jpg',
    name: 'BMP to JPG',
    description: 'Convert BMP bitmap images to JPG.',
    category: 'convert',
    inputFormats: ['bmp'],
    outputFormats: ['jpg'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '🖼️',
    keywords: ['bmp', 'bitmap', 'jpg', 'convert'],
  },

  // ===== COMPRESS =====
  {
    id: 'compress-jpg',
    name: 'Compress JPG',
    description: 'Reduce JPG file size with adjustable quality.',
    category: 'compress',
    inputFormats: ['jpg', 'jpeg'],
    outputFormats: ['jpg'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '📦',
    keywords: ['compress', 'jpg', 'jpeg', 'reduce', 'smaller'],
  },
  {
    id: 'compress-png',
    name: 'Compress PNG',
    description: 'Reduce PNG file size while maintaining quality.',
    category: 'compress',
    inputFormats: ['png'],
    outputFormats: ['png'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '📦',
    keywords: ['compress', 'png', 'reduce', 'smaller'],
  },
  {
    id: 'compress-webp',
    name: 'Compress WebP',
    description: 'Optimize WebP file size with quality control.',
    category: 'compress',
    inputFormats: ['webp'],
    outputFormats: ['webp'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '📦',
    keywords: ['compress', 'webp', 'reduce', 'optimize'],
  },
  {
    id: 'compress-heic',
    name: 'Compress HEIC',
    description: 'Compress Apple HEIC photos locally while preserving quality.',
    category: 'compress',
    inputFormats: ['heic', 'heif'],
    outputFormats: ['jpg'],
    engine: 'heic',
    processing: 'local',
    supportsBatch: true,
    icon: '📦',
    keywords: ['compress', 'heic', 'heif', 'iphone', 'apple', 'reduce', 'smaller'],
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce PDF file size with 4K Ultra-HD or custom compression controls. 100% in-browser.',
    category: 'compress',
    inputFormats: ['pdf'],
    outputFormats: ['pdf'],
    engine: 'pdfjs',
    processing: 'local',
    supportsBatch: true,
    icon: '📦',
    keywords: ['compress', 'pdf', 'reduce', 'smaller', '4k', 'size', 'shrink', 'document'],
  },
  {
    id: 'compress-image',
    name: 'Compress Image',
    description: 'Compress any image format with intelligent quality control.',
    category: 'compress',
    inputFormats: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'heic', 'heif'],
    outputFormats: ['jpg', 'png', 'webp'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '📦',
    keywords: ['compress', 'image', 'reduce', 'smaller', 'any', 'heic', 'iphone'],
  },

  // ===== RESIZE =====
  {
    id: 'resize-image',
    name: 'Resize Image',
    description: 'Resize images to custom dimensions or standard presets.',
    category: 'resize',
    inputFormats: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'heic', 'heif'],
    outputFormats: ['jpg', 'png', 'webp'],
    engine: 'canvas',
    processing: 'local',
    supportsBatch: true,
    icon: '📐',
    keywords: ['resize', 'scale', 'dimensions', 'width', 'height', 'heic', 'iphone'],
  },

  // ===== PDF =====
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Combine one or more images into a PDF document.',
    category: 'pdf',
    inputFormats: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'avif', 'heic', 'heif'],
    outputFormats: ['pdf'],
    engine: 'pdf-lib',
    processing: 'local',
    supportsBatch: true,
    icon: '📄',
    keywords: ['image', 'pdf', 'create', 'combine', 'document', 'heic', 'iphone'],
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Extract PDF pages as JPG images.',
    category: 'pdf',
    inputFormats: ['pdf'],
    outputFormats: ['jpg'],
    engine: 'pdfjs',
    processing: 'local',
    supportsBatch: false,
    icon: '📄',
    keywords: ['pdf', 'jpg', 'extract', 'pages', 'image'],
  },
  {
    id: 'pdf-to-png',
    name: 'PDF to PNG',
    description: 'Extract PDF pages as high-quality PNG images.',
    category: 'pdf',
    inputFormats: ['pdf'],
    outputFormats: ['png'],
    engine: 'pdfjs',
    processing: 'local',
    supportsBatch: false,
    icon: '📄',
    keywords: ['pdf', 'png', 'extract', 'pages', 'image'],
  },
  // ===== POWERPOINT =====
  {
    id: 'pptx-to-pdf',
    name: 'PPTX to PDF',
    description: 'Convert PowerPoint presentations to PDF documents. 100% in-browser.',
    category: 'powerpoint',
    inputFormats: ['pptx'],
    outputFormats: ['pdf'],
    engine: 'pptx',
    processing: 'local',
    supportsBatch: false,
    icon: '📊',
    keywords: ['pptx', 'powerpoint', 'pdf', 'presentation', 'slides'],
  },
  {
    id: 'pptx-to-png',
    name: 'PPTX to PNG',
    description: 'Export PowerPoint presentation slides as individual PNG images.',
    category: 'powerpoint',
    inputFormats: ['pptx'],
    outputFormats: ['png'],
    engine: 'pptx',
    processing: 'local',
    supportsBatch: false,
    icon: '📊',
    keywords: ['pptx', 'powerpoint', 'png', 'images', 'slides'],
  },
  {
    id: 'pptx-to-jpg',
    name: 'PPTX to JPG',
    description: 'Export PowerPoint presentation slides as compressed JPG images.',
    category: 'powerpoint',
    inputFormats: ['pptx'],
    outputFormats: ['jpg'],
    engine: 'pptx',
    processing: 'local',
    supportsBatch: false,
    icon: '📊',
    keywords: ['pptx', 'powerpoint', 'jpg', 'jpeg', 'slides'],
  },
  {
    id: 'pptx-to-text',
    name: 'PPTX to Text',
    description: 'Extract all text content from PowerPoint slides slide-by-slide (.txt / .md).',
    category: 'powerpoint',
    inputFormats: ['pptx'],
    outputFormats: ['txt', 'md'],
    engine: 'pptx',
    processing: 'local',
    supportsBatch: false,
    icon: '📝',
    keywords: ['pptx', 'powerpoint', 'text', 'extract', 'markdown', 'notes'],
  },
];

// ===== REGISTRY LOOKUP FUNCTIONS =====

export function getToolById(id: string): ConversionTool | undefined {
  return tools.find((t) => t.id === id);
}

export function getToolsByCategory(category: ToolCategory): ConversionTool[] {
  return tools.filter((t) => t.category === category);
}

export function getToolsForInputFormat(extension: string): ConversionTool[] {
  const ext = extension.toLowerCase();
  return tools.filter((t) => t.inputFormats.includes(ext));
}

export function getRelatedTools(toolId: string): ConversionTool[] {
  const tool = getToolById(toolId);
  if (!tool) return [];
  return tools.filter(
    (t) =>
      t.id !== toolId &&
      (t.category === tool.category ||
        t.inputFormats.some((f) => tool.inputFormats.includes(f)) ||
        t.outputFormats.some((f) => tool.outputFormats.includes(f)))
  ).slice(0, 6);
}

export function searchTools(query: string): ConversionTool[] {
  const q = query.toLowerCase().trim();
  if (!q) return tools;
  return tools.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.includes(q)) ||
      t.inputFormats.some((f) => f.includes(q)) ||
      t.outputFormats.some((f) => f.includes(q))
  );
}

export function getConvertTools(): ConversionTool[] {
  return getToolsByCategory('convert');
}

export function getCompressTools(): ConversionTool[] {
  return getToolsByCategory('compress');
}

export function getResizeTools(): ConversionTool[] {
  return getToolsByCategory('resize');
}

export function getPdfTools(): ConversionTool[] {
  return getToolsByCategory('pdf');
}

export function getPowerPointTools(): ConversionTool[] {
  return getToolsByCategory('powerpoint');
}
