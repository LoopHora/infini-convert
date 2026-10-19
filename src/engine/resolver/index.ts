// ===== ACTION RESOLVER =====
// Deterministic compatible action resolution and ranking for detected files.
// Matches Infini-Convert Auto-Detect specification: 3-5 ranked useful actions + More options.

import type { DetectedFile, BatchSummary } from '@/engine/detector';

export interface ResolvedAction {
  id: string;
  category: 'convert' | 'compress' | 'resize' | 'pdf';
  title: string;
  subtitle: string;
  badge?: string;
  isRecommended: boolean;
  priority: number;
  targetFormat?: string;
  engine: string;
  supportsBatch: boolean;
  isAdvanced?: boolean; // Placed behind "More options →"
  iconName: 'Minimize2' | 'RefreshCw' | 'Sliders' | 'FileText' | 'Sparkles' | 'Layers';
}

export interface ActionResolution {
  primaryActions: ResolvedAction[];
  moreOptions: ResolvedAction[];
  allActions: ResolvedAction[];
  summaryText: string;
}

/**
 * Resolves compatible, ranked actions for single or multiple detected files
 */
export function resolveActions(files: DetectedFile[], summary: BatchSummary): ActionResolution {
  if (files.length === 0) {
    return { primaryActions: [], moreOptions: [], allActions: [], summaryText: '' };
  }

  // MULTIPLE FILES RESOLUTION
  if (files.length > 1) {
    return resolveBatchActions(files, summary);
  }

  // SINGLE FILE RESOLUTION
  const file = files[0];
  return resolveSingleFileActions(file);
}

function resolveSingleFileActions(file: DetectedFile): ActionResolution {
  const fmt = file.detectedFormat;
  const actions: ResolvedAction[] = [];

  if (fmt === 'pptx') {
    actions.push(
      {
        id: 'pptx-to-pdf',
        category: 'pdf',
        title: 'Convert to PDF',
        subtitle: 'Export entire presentation into a single PDF document',
        badge: 'Recommended',
        isRecommended: true,
        priority: 100,
        targetFormat: 'pdf',
        engine: 'pptx',
        supportsBatch: false,
        iconName: 'FileText',
      },
      {
        id: 'pptx-to-png',
        category: 'convert',
        title: 'Convert to PNG',
        subtitle: 'Render PNG slide images (download ZIP or single)',
        isRecommended: false,
        priority: 90,
        targetFormat: 'png',
        engine: 'pptx',
        supportsBatch: false,
        iconName: 'RefreshCw',
      },
      {
        id: 'pptx-to-jpg',
        category: 'convert',
        title: 'Convert to JPG',
        subtitle: 'Universal compressed slide images (one per slide)',
        isRecommended: false,
        priority: 85,
        targetFormat: 'jpg',
        engine: 'pptx',
        supportsBatch: false,
        iconName: 'RefreshCw',
      },
      {
        id: 'pptx-extract-text',
        category: 'convert',
        title: 'Extract Text (.txt / .md)',
        subtitle: 'Extract all visible slide text structured slide-by-slide',
        isRecommended: false,
        priority: 80,
        targetFormat: 'txt',
        engine: 'pptx',
        supportsBatch: false,
        iconName: 'Sparkles',
      }
    );

    return {
      primaryActions: actions,
      moreOptions: [],
      allActions: actions,
      summaryText: `PowerPoint presentation detected · ${file.slideCount || 1} slide${(file.slideCount || 1) !== 1 ? 's' : ''}`,
    };
  }

  if (fmt === 'heic') {
    actions.push(
      {
        id: 'heic-to-jpg',
        category: 'convert',
        title: 'Convert to JPG',
        subtitle: 'Universally compatible format for any device or web app',
        badge: 'Recommended',
        isRecommended: true,
        priority: 100,
        targetFormat: 'jpg',
        engine: 'heic',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'heic-to-png',
        category: 'convert',
        title: 'Convert to PNG',
        subtitle: 'PNG export with color preservation',
        isRecommended: false,
        priority: 90,
        targetFormat: 'png',
        engine: 'heic',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'heic-to-webp',
        category: 'convert',
        title: 'Convert to WebP',
        subtitle: 'Modern next-gen format with superior compression',
        isRecommended: false,
        priority: 85,
        targetFormat: 'webp',
        engine: 'heic',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'compress-image',
        category: 'compress',
        title: 'Compress Photo',
        subtitle: 'Reduce storage size while maintaining high quality',
        isRecommended: false,
        priority: 80,
        targetFormat: 'jpg',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Minimize2',
      },
      {
        id: 'resize-image',
        category: 'resize',
        title: 'Resize Dimensions',
        subtitle: 'Scale width and height with aspect ratio lock',
        isRecommended: false,
        priority: 70,
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Sliders',
      },
      {
        id: 'image-to-pdf',
        category: 'pdf',
        title: 'Create PDF',
        subtitle: 'Turn this photo into a standard PDF document',
        isRecommended: false,
        priority: 60,
        targetFormat: 'pdf',
        engine: 'pdf-lib',
        supportsBatch: true,
        iconName: 'FileText',
      }
    );
  } else if (fmt === 'jpg') {
    // If large file (> 1.5MB), prioritize compression
    const isLarge = file.size > 1.5 * 1024 * 1024;
    actions.push(
      {
        id: 'compress-jpg',
        category: 'compress',
        title: 'Compress JPG',
        subtitle: isLarge ? 'Significantly shrink file size (recommended for large images)' : 'Make file smaller with adjustable quality',
        badge: isLarge ? 'Recommended' : undefined,
        isRecommended: isLarge,
        priority: isLarge ? 100 : 90,
        targetFormat: 'jpg',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Minimize2',
      },
      {
        id: 'jpg-to-webp',
        category: 'convert',
        title: 'Convert to WebP',
        subtitle: 'Modern next-gen format for faster web performance (30% smaller)',
        badge: !isLarge ? 'Recommended' : undefined,
        isRecommended: !isLarge,
        priority: isLarge ? 90 : 100,
        targetFormat: 'webp',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'jpg-to-png',
        category: 'convert',
        title: 'Convert to PNG',
        subtitle: 'PNG format for graphics and transparency',
        isRecommended: false,
        priority: 80,
        targetFormat: 'png',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'resize-image',
        category: 'resize',
        title: 'Resize Image',
        subtitle: 'Change image pixel dimensions with precise size controls',
        isRecommended: false,
        priority: 70,
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Sliders',
      },
      {
        id: 'image-to-pdf',
        category: 'pdf',
        title: 'Create PDF Document',
        subtitle: 'Package image into a single-page PDF',
        isRecommended: false,
        priority: 60,
        targetFormat: 'pdf',
        engine: 'pdf-lib',
        supportsBatch: true,
        iconName: 'FileText',
      },
      {
        id: 'jpg-to-avif',
        category: 'convert',
        title: 'Convert to AVIF',
        subtitle: 'Ultra-compressed next-generation web image format',
        isRecommended: false,
        priority: 40,
        targetFormat: 'avif',
        engine: 'canvas',
        supportsBatch: true,
        isAdvanced: true,
        iconName: 'RefreshCw',
      }
    );
  } else if (fmt === 'png') {
    actions.push(
      {
        id: 'png-to-webp',
        category: 'convert',
        title: 'Convert to WebP',
        subtitle: 'Drastically smaller file weight while preserving transparency',
        badge: 'Recommended',
        isRecommended: true,
        priority: 100,
        targetFormat: 'webp',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'compress-png',
        category: 'compress',
        title: 'Compress PNG',
        subtitle: 'Optimize palette and deflate size without loss',
        isRecommended: false,
        priority: 90,
        targetFormat: 'png',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Minimize2',
      },
      {
        id: 'png-to-jpg',
        category: 'convert',
        title: 'Convert to JPG',
        subtitle: 'Universal photo format (opaque white background)',
        isRecommended: false,
        priority: 80,
        targetFormat: 'jpg',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'resize-image',
        category: 'resize',
        title: 'Resize Image',
        subtitle: 'Scale pixel dimensions with aspect ratio lock',
        isRecommended: false,
        priority: 70,
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Sliders',
      },
      {
        id: 'image-to-pdf',
        category: 'pdf',
        title: 'Convert to PDF',
        subtitle: 'Generate clean PDF document from PNG',
        isRecommended: false,
        priority: 60,
        targetFormat: 'pdf',
        engine: 'pdf-lib',
        supportsBatch: true,
        iconName: 'FileText',
      },
      {
        id: 'png-to-avif',
        category: 'convert',
        title: 'Convert to AVIF',
        subtitle: 'Ultra next-gen compression with alpha channel support',
        isRecommended: false,
        priority: 40,
        targetFormat: 'avif',
        engine: 'canvas',
        supportsBatch: true,
        isAdvanced: true,
        iconName: 'RefreshCw',
      }
    );
  } else if (fmt === 'webp') {
    actions.push(
      {
        id: 'webp-to-jpg',
        category: 'convert',
        title: 'Convert to JPG',
        subtitle: 'Export for apps or platforms that do not yet support WebP',
        badge: 'Recommended',
        isRecommended: true,
        priority: 100,
        targetFormat: 'jpg',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'webp-to-png',
        category: 'convert',
        title: 'Convert to PNG',
        subtitle: 'Extract PNG image for editing tools',
        isRecommended: false,
        priority: 90,
        targetFormat: 'png',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'compress-webp',
        category: 'compress',
        title: 'Compress WebP',
        subtitle: 'Tune lossy quality parameters to shrink file further',
        isRecommended: false,
        priority: 80,
        targetFormat: 'webp',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Minimize2',
      },
      {
        id: 'resize-image',
        category: 'resize',
        title: 'Resize WebP',
        subtitle: 'Adjust width and height dimensions',
        isRecommended: false,
        priority: 70,
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Sliders',
      },
      {
        id: 'image-to-pdf',
        category: 'pdf',
        title: 'Create PDF',
        subtitle: 'Embed WebP image into a PDF page',
        isRecommended: false,
        priority: 60,
        targetFormat: 'pdf',
        engine: 'pdf-lib',
        supportsBatch: true,
        iconName: 'FileText',
      }
    );
  } else if (fmt === 'pdf') {
    actions.push(
      {
        id: 'compress-pdf',
        category: 'compress',
        title: 'Compress PDF',
        subtitle: 'Reduce PDF file size with 4K Ultra-HD or custom quality controls',
        badge: 'Recommended',
        isRecommended: true,
        priority: 105,
        targetFormat: 'pdf',
        engine: 'pdf-compress',
        supportsBatch: true,
        iconName: 'Minimize2',
      },
      {
        id: 'pdf-to-jpg',
        category: 'pdf',
        title: 'Extract PDF to JPG',
        subtitle: 'Render pages into JPG images (individual or ZIP archive)',
        isRecommended: false,
        priority: 95,
        targetFormat: 'jpg',
        engine: 'pdfjs',
        supportsBatch: false,
        iconName: 'FileText',
      },
      {
        id: 'pdf-to-png',
        category: 'pdf',
        title: 'Extract PDF to PNG',
        subtitle: 'Render document pages to PNG image files',
        isRecommended: false,
        priority: 90,
        targetFormat: 'png',
        engine: 'pdfjs',
        supportsBatch: false,
        iconName: 'FileText',
      }
    );
  } else if (file.isImage) {
    // Other image formats (BMP, GIF, TIFF, AVIF)
    actions.push(
      {
        id: 'convert-to-jpg',
        category: 'convert',
        title: 'Convert to JPG',
        subtitle: 'Convert into widely compatible standard JPG',
        badge: 'Recommended',
        isRecommended: true,
        priority: 100,
        targetFormat: 'jpg',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'convert-to-png',
        category: 'convert',
        title: 'Convert to PNG',
        subtitle: 'Convert to PNG format',
        isRecommended: false,
        priority: 90,
        targetFormat: 'png',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'compress-image',
        category: 'compress',
        title: 'Compress Image',
        subtitle: 'Optimize quality and reduce file size',
        isRecommended: false,
        priority: 80,
        targetFormat: 'jpg',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Minimize2',
      },
      {
        id: 'resize-image',
        category: 'resize',
        title: 'Resize Image',
        subtitle: 'Scale width and height dimensions',
        isRecommended: false,
        priority: 70,
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Sliders',
      }
    );
  }

  // Sort by priority descending
  actions.sort((a, b) => b.priority - a.priority);

  // Top 3 to 5 are primary, remainder or isAdvanced go behind "More options"
  const primaryActions = actions.filter((a) => !a.isAdvanced).slice(0, 4);
  const moreOptions = actions.filter((a) => a.isAdvanced || !primaryActions.includes(a));

  return {
    primaryActions,
    moreOptions,
    allActions: actions,
    summaryText: `${file.name} (${fmt.toUpperCase()})`,
  };
}

function resolveBatchActions(files: DetectedFile[], summary: BatchSummary): ActionResolution {
  const actions: ResolvedAction[] = [];

  if (summary.allImages) {
    actions.push(
      {
        id: 'image-to-pdf-batch',
        category: 'pdf',
        title: 'Combine All into One PDF',
        subtitle: `Merge all ${files.length} images into a single multi-page PDF document`,
        badge: 'Recommended',
        isRecommended: true,
        priority: 100,
        targetFormat: 'pdf',
        engine: 'pdf-lib',
        supportsBatch: true,
        iconName: 'FileText',
      },
      {
        id: 'batch-compress',
        category: 'compress',
        title: 'Compress All Images',
        subtitle: `Batch compress all ${files.length} images with uniform quality setting (download as ZIP)`,
        isRecommended: false,
        priority: 90,
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Minimize2',
      },
      {
        id: 'batch-convert-webp',
        category: 'convert',
        title: 'Convert All to WebP',
        subtitle: 'Standardize all images to modern WebP format for web',
        isRecommended: false,
        priority: 85,
        targetFormat: 'webp',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'batch-convert-jpg',
        category: 'convert',
        title: 'Convert All to JPG',
        subtitle: 'Standardize all images to universally supported JPG',
        isRecommended: false,
        priority: 80,
        targetFormat: 'jpg',
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'RefreshCw',
      },
      {
        id: 'batch-resize',
        category: 'resize',
        title: 'Resize All Images',
        subtitle: 'Batch scale all images to uniform pixel dimensions or preset',
        isRecommended: false,
        priority: 70,
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Sliders',
      }
    );
  } else if (summary.allPdfs) {
    actions.push(
      {
        id: 'batch-compress-pdf',
        category: 'compress',
        title: 'Compress All PDFs',
        subtitle: `Batch shrink all ${files.length} PDF documents with 4K or custom quality`,
        badge: 'Recommended',
        isRecommended: true,
        priority: 105,
        engine: 'pdf-compress',
        supportsBatch: true,
        iconName: 'Minimize2',
      },
      {
        id: 'pdf-to-jpg-batch',
        category: 'pdf',
        title: 'Extract All PDFs to JPG',
        subtitle: `Render all pages across ${files.length} PDFs as JPG images`,
        isRecommended: false,
        priority: 95,
        targetFormat: 'jpg',
        engine: 'pdfjs',
        supportsBatch: false,
        iconName: 'FileText',
      },
      {
        id: 'pdf-to-png-batch',
        category: 'pdf',
        title: 'Extract All PDFs to PNG',
        subtitle: 'Extract pages from all PDFs to PNG',
        isRecommended: false,
        priority: 90,
        targetFormat: 'png',
        engine: 'pdfjs',
        supportsBatch: false,
        iconName: 'FileText',
      }
    );
  } else {
    // Mixed file types (e.g. Images + PDFs)
    actions.push(
      {
        id: 'compress-mixed',
        category: 'compress',
        title: 'Compress Compatible Files',
        subtitle: 'Optimize file weights across supported items',
        badge: 'Batch',
        isRecommended: true,
        priority: 100,
        engine: 'canvas',
        supportsBatch: true,
        iconName: 'Minimize2',
      }
    );
  }

  actions.sort((a, b) => b.priority - a.priority);
  const primaryActions = actions.slice(0, 4);
  const moreOptions = actions.slice(4);

  return {
    primaryActions,
    moreOptions,
    allActions: actions,
    summaryText: `${files.length} files selected`,
  };
}
