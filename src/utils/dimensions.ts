// ===== PROPORTIONAL BOUNDING BOX & DIMENSION ENGINE =====
// Strict aspect-ratio preservation for custom pixel dimensions and bounding boxes.
// PRESET POLICY: Downscale/fit only. Presets never automatically upscale an image.

export interface BoundingBoxPreset {
  id: string;
  label: string;
  maxWidth: number;
  maxHeight: number;
  description: string;
}

export const BOUNDING_BOX_PRESETS: BoundingBoxPreset[] = [
  {
    id: '1280px',
    label: 'Fit 1280px',
    maxWidth: 1280,
    maxHeight: 1280,
    description: 'Reduce dimensions to fit within 1280 pixels while preserving aspect ratio.',
  },
  {
    id: '1920px',
    label: 'Fit 1920px',
    maxWidth: 1920,
    maxHeight: 1920,
    description: 'Reduce dimensions to fit within 1920 pixels while preserving aspect ratio.',
  },
  {
    id: '2560px',
    label: 'Fit 2560px',
    maxWidth: 2560,
    maxHeight: 2560,
    description: 'Reduce dimensions to fit within 2560 pixels while preserving aspect ratio.',
  },
  {
    id: '3840px',
    label: 'Fit 3840px',
    maxWidth: 3840,
    maxHeight: 3840,
    description: 'Reduce dimensions to fit within 3840 pixels while preserving aspect ratio.',
  },
  {
    id: 'square',
    label: 'Square 1080px',
    maxWidth: 1080,
    maxHeight: 1080,
    description: 'Fit within 1080×1080px while preserving aspect ratio.',
  },
];

/**
 * Fits original image dimensions proportionally inside a target bounding box.
 * Automatically respects orientation (landscape vs portrait).
 * Does NOT stretch or distort the image.
 *
 * PRESET POLICY: NO AUTOMATIC UPSCALING.
 * - If original dimensions are already inside the bounding box, returns original dimensions unchanged.
 * - If original dimensions exceed the bounding box, proportionally downscales to fit.
 * - Custom pixel resizing may pass allowEnlarge = true if the user explicitly requested larger dimensions.
 *
 * Examples:
 * - 640×360 + Fit 1920px -> remain 640×360 (already inside box)
 * - 877×171 + Fit 3840px -> remain 877×171 (already inside box)
 * - 4000×3000 + Fit 3840px -> 3840×2880 (scaled down to fit 3840px)
 * - 1920×1080 + Fit 1280px -> 1280×720 (scaled down to fit 1280px)
 */
export function fitDimensionsInsideBoundingBox(
  origWidth: number,
  origHeight: number,
  boundWidth: number,
  boundHeight: number,
  allowEnlarge: boolean = false
): { width: number; height: number; scale: number; isEnlarged: boolean } {
  if (origWidth <= 0 || origHeight <= 0) {
    return {
      width: Math.max(1, boundWidth),
      height: Math.max(1, boundHeight),
      scale: 1,
      isEnlarged: false,
    };
  }

  // Adjust bounding box orientation to match source orientation:
  // If source is portrait (height > width), orient bounding box vertically
  let targetBoxW = boundWidth;
  let targetBoxH = boundHeight;
  if (origHeight > origWidth && boundWidth > boundHeight) {
    targetBoxW = boundHeight;
    targetBoxH = boundWidth;
  } else if (origWidth >= origHeight && boundHeight > boundWidth) {
    targetBoxW = boundHeight;
    targetBoxH = boundWidth;
  }

  const rawScale = Math.min(targetBoxW / origWidth, targetBoxH / origHeight);

  // If source already fits inside the bounding box and enlargement is not explicitly allowed:
  if (rawScale >= 1.0 && !allowEnlarge) {
    return {
      width: origWidth,
      height: origHeight,
      scale: 1.0,
      isEnlarged: false,
    };
  }

  const scale = allowEnlarge ? rawScale : Math.min(1.0, rawScale);
  const width = Math.max(1, Math.round(origWidth * scale));
  const height = Math.max(1, Math.round(origHeight * scale));

  return {
    width,
    height,
    scale,
    isEnlarged: scale > 1.0,
  };
}

/**
 * Resolves preset identifier to calculated dimensions.
 * By default, presets NEVER automatically upscale.
 */
export function calculatePresetDimensions(
  origWidth: number,
  origHeight: number,
  presetId: string,
  allowEnlarge: boolean = false
): { width: number; height: number; scale: number; preset: BoundingBoxPreset | null } {
  const aliasMap: Record<string, string> = {
    '1080p': '1920px',
    '720p': '1280px',
    '1440p': '2560px',
    '4k': '3840px',
    'social': 'square',
  };
  const cleanId = aliasMap[presetId.toLowerCase()] || presetId.toLowerCase();
  const preset = BOUNDING_BOX_PRESETS.find((p) => p.id.toLowerCase() === cleanId) || null;
  if (!preset) {
    // If numeric string or pixel format like "1920px"
    const num = parseInt(presetId.replace(/px$/i, ''), 10);
    if (!isNaN(num) && num > 0) {
      const res = fitDimensionsInsideBoundingBox(origWidth, origHeight, num, num, allowEnlarge);
      return { width: res.width, height: res.height, scale: res.scale, preset: null };
    }
    return { width: origWidth, height: origHeight, scale: 1, preset: null };
  }

  const res = fitDimensionsInsideBoundingBox(origWidth, origHeight, preset.maxWidth, preset.maxHeight, allowEnlarge);
  return {
    width: res.width,
    height: res.height,
    scale: res.scale,
    preset,
  };
}
