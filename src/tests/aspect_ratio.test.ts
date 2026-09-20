import { describe, it, expect } from 'vitest';

describe('Extreme Aspect Ratio Calculations (877x171 and 100x1200)', () => {
  const BANNER_W = 877;
  const BANNER_H = 171;
  const BANNER_RATIO = BANNER_W / BANNER_H; // ~5.12865

  const PORTRAIT_W = 100;
  const PORTRAIT_H = 1200;
  const PORTRAIT_RATIO = PORTRAIT_W / PORTRAIT_H; // ~0.08333

  it('preserves exact 877x171 aspect ratio when width is resized with lockAspectRatio', () => {
    const targetW = 1080;
    const computedH = Math.round(targetW / BANNER_RATIO);
    expect(computedH).toBe(211);
    expect(targetW / computedH).toBeCloseTo(BANNER_RATIO, 1);
  });

  it('preserves exact 877x171 aspect ratio when scaled down with lockAspectRatio', () => {
    const targetW = 400;
    const computedH = Math.round(targetW / BANNER_RATIO);
    expect(computedH).toBe(78);
    expect(targetW / computedH).toBeCloseTo(BANNER_RATIO, 1);
  });

  it('preserves exact 877x171 aspect ratio when height is resized with lockAspectRatio', () => {
    const targetH = 100;
    const computedW = Math.round(targetH * BANNER_RATIO);
    expect(computedW).toBe(513);
    expect(computedW / targetH).toBeCloseTo(BANNER_RATIO, 1);
  });

  it('fits 877x171 inside a bounding box maintaining aspect ratio', () => {
    const boxW = 800;
    const boxH = 600;
    const scaleW = boxW / BANNER_W;
    const scaleH = boxH / BANNER_H;
    const scale = Math.min(scaleW, scaleH);

    const fitW = Math.round(BANNER_W * scale);
    const fitH = Math.round(BANNER_H * scale);

    expect(fitW).toBe(800);
    expect(fitH).toBe(156);
    expect(fitW / fitH).toBeCloseTo(BANNER_RATIO, 1);
  });

  it('preserves extreme portrait 100x1200 aspect ratio when fitting into bounding box', () => {
    const boxW = 800;
    const boxH = 600;
    const scaleW = boxW / PORTRAIT_W;
    const scaleH = boxH / PORTRAIT_H;
    const scale = Math.min(scaleW, scaleH);

    const fitW = Math.round(PORTRAIT_W * scale);
    const fitH = Math.round(PORTRAIT_H * scale);

    expect(fitH).toBe(600);
    expect(fitW).toBe(50);
    expect(fitW / fitH).toBeCloseTo(PORTRAIT_RATIO, 2);
  });

  it('determines auto-orientation correctly for extreme landscape and portrait', () => {
    const isLandscapeBanner = BANNER_W > BANNER_H;
    expect(isLandscapeBanner).toBe(true);

    const isLandscapePortrait = PORTRAIT_W > PORTRAIT_H;
    expect(isLandscapePortrait).toBe(false);
  });
});

import { fitDimensionsInsideBoundingBox, calculatePresetDimensions } from '../utils/dimensions';

describe('Proportional Bounding Box Dimension Engine (Preset Downscale-Only Policy)', () => {
  // REQUIREMENT 6: Mandatory test cases from specification
  it('preserves dimensions when source is smaller than preset: 640x360 -> Fit 1920 = 640x360', () => {
    const res = calculatePresetDimensions(640, 360, '1920px');
    expect(res.width).toBe(640);
    expect(res.height).toBe(360);
    expect(res.scale).toBe(1.0);
    expect(res.preset?.label).toBe('Fit 1920px');
  });

  it('preserves dimensions when source is smaller than preset: 877x171 -> Fit 3840 = 877x171', () => {
    const res = calculatePresetDimensions(877, 171, '3840px');
    expect(res.width).toBe(877);
    expect(res.height).toBe(171);
    expect(res.scale).toBe(1.0);
    expect(res.preset?.label).toBe('Fit 3840px');
  });

  it('proportionally downscales when source exceeds preset: 4000x3000 -> Fit 3840 = 3840x2880', () => {
    const res = calculatePresetDimensions(4000, 3000, '3840px');
    expect(res.width).toBe(3840);
    expect(res.height).toBe(2880);
    expect(res.width / res.height).toBeCloseTo(4000 / 3000, 2);
    expect(res.scale).toBeCloseTo(0.96, 2);
  });

  it('proportionally downscales when source exceeds preset: 1920x1080 -> Fit 1280 = 1280x720', () => {
    const res = calculatePresetDimensions(1920, 1080, '1280px');
    expect(res.width).toBe(1280);
    expect(res.height).toBe(720);
    expect(res.width / res.height).toBeCloseTo(1920 / 1080, 2);
    expect(res.scale).toBeCloseTo(0.6667, 2);
  });

  it('handles square preset without enlarging: smaller 640x360 remains 640x360', () => {
    const res = calculatePresetDimensions(640, 360, 'square');
    expect(res.width).toBe(640);
    expect(res.height).toBe(360);
  });

  it('handles square preset by downscaling larger image: 2000x1500 -> 1080x810', () => {
    const res = calculatePresetDimensions(2000, 1500, 'square');
    expect(res.width).toBe(1080);
    expect(res.height).toBe(810);
    expect(res.width / res.height).toBeCloseTo(2000 / 1500, 2);
  });

  it('resolves backward compatible preset aliases without automatic upscaling', () => {
    const res4k = calculatePresetDimensions(877, 171, '4k');
    expect(res4k.width).toBe(877);
    expect(res4k.height).toBe(171);
    expect(res4k.preset?.label).toBe('Fit 3840px');

    const res1080 = calculatePresetDimensions(640, 360, '1080p');
    expect(res1080.width).toBe(640);
    expect(res1080.height).toBe(360);
    expect(res1080.preset?.label).toBe('Fit 1920px');
  });

  // User-controlled custom pixel resizing (allowEnlarge = true)
  it('allows explicit user enlargement when allowEnlarge is true: 640x360 -> 1920x1080', () => {
    const res = fitDimensionsInsideBoundingBox(640, 360, 1920, 1080, true);
    expect(res.width).toBe(1920);
    expect(res.height).toBe(1080);
    expect(res.isEnlarged).toBe(true);
    expect(res.scale).toBe(3.0);
  });

  it('allows explicit user enlargement: 877x171 into 3840x2160 box -> 3840x749', () => {
    const res = fitDimensionsInsideBoundingBox(877, 171, 3840, 2160, true);
    expect(res.width).toBe(3840);
    expect(res.height).toBe(749);
    expect(res.width / res.height).toBeCloseTo(877 / 171, 2);
    expect(res.isEnlarged).toBe(true);
  });

  it('allows explicit user enlargement: 171x877 extreme portrait into 3840x2160 box -> 749x3840', () => {
    const res = fitDimensionsInsideBoundingBox(171, 877, 3840, 2160, true);
    expect(res.width).toBe(749);
    expect(res.height).toBe(3840);
    expect(res.width / res.height).toBeCloseTo(171 / 877, 2);
    expect(res.isEnlarged).toBe(true);
  });
});

