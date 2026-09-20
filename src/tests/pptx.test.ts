import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { detectFormatFromSignature } from '../engine/detector';
import { getPptxMetadata, extractPptxText } from '../engine/pptx';
import { resolveActions } from '../engine/resolver';
import type { DetectedFile, BatchSummary } from '../engine/detector';

/**
 * Helper to generate an authentic 3-slide PPTX package in memory
 */
async function createSamplePptx(): Promise<File> {
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1"/>
    <p:sldId id="257" r:id="rId2"/>
    <p:sldId id="258" r:id="rId3"/>
  </p:sldIdLst>
</p:presentation>`
  );

  zip.file(
    'ppt/slides/slide1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>Introduction to Data Analytics</a:t></a:r></a:p>
          <a:p><a:r><a:t>Infini-Convert Presentation Engine</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
  );

  zip.file(
    'ppt/slides/slide2.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>What is Machine Learning?</a:t></a:r></a:p>
          <a:p><a:r><a:t>• Supervised learning</a:t></a:r></a:p>
          <a:p><a:r><a:t>• Unsupervised learning</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
  );

  zip.file(
    'ppt/slides/slide3.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>Applications &amp; Healthcare</a:t></a:r></a:p>
          <a:p><a:r><a:t>• Medical imaging diagnostics</a:t></a:r></a:p>
          <a:p><a:r><a:t>• Financial fraud detection</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  return new File([blob], 'quarterly-report.pptx', {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
}

describe('PowerPoint (.PPTX) Engine & Detection', () => {
  it('detects PPTX format via signature and extension', async () => {
    const file = await createSamplePptx();
    const format = await detectFormatFromSignature(file);
    expect(format).toBe('pptx');
  });

  it('extracts slide count metadata from PPTX package', async () => {
    const file = await createSamplePptx();
    const meta = await getPptxMetadata(file);
    expect(meta.slideCount).toBe(3);
  });

  it('extracts structured slide-by-slide text from PPTX slides', async () => {
    const file = await createSamplePptx();
    const result = await extractPptxText(file);

    expect(result.slideCount).toBe(3);
    expect(result.slides[0].title).toBe('Introduction to Data Analytics');
    expect(result.slides[0].lines).toContain('Introduction to Data Analytics');
    expect(result.slides[0].lines).toContain('Infini-Convert Presentation Engine');

    expect(result.slides[1].title).toBe('What is Machine Learning?');
    expect(result.slides[1].lines).toContain('• Supervised learning');
    expect(result.slides[1].lines).toContain('• Unsupervised learning');

    expect(result.slides[2].title).toBe('Applications & Healthcare');
    expect(result.slides[2].lines).toContain('• Medical imaging diagnostics');

    // Formatted plain text check
    expect(result.text).toContain('Slide 1\n--------\nIntroduction to Data Analytics');
    expect(result.text).toContain('Slide 2\n--------\nWhat is Machine Learning?');

    // Formatted markdown check
    expect(result.markdown).toContain('## Slide 1: Introduction to Data Analytics');
    expect(result.markdown).toContain('## Slide 2: What is Machine Learning?');
  });

  it('resolves ranked actions for PPTX presentation (PDF first, then PNG/JPG, then text)', async () => {
    const file = await createSamplePptx();
    const detected: DetectedFile = {
      id: 'test-pptx',
      file,
      name: file.name,
      size: file.size,
      extension: 'pptx',
      mimeType: file.type,
      detectedFormat: 'pptx',
      isImage: false,
      isPdf: false,
      isPptx: true,
      slideCount: 3,
      isValid: true,
    };

    const summary: BatchSummary = {
      totalFiles: 1,
      totalSize: file.size,
      formatCounts: { pptx: 1 },
      allImages: false,
      allPdfs: false,
      mixedTypes: false,
    };

    const resolution = resolveActions([detected], summary);

    expect(resolution.primaryActions.length).toBe(4);
    expect(resolution.primaryActions[0].id).toBe('pptx-to-pdf');
    expect(resolution.primaryActions[0].isRecommended).toBe(true);
    expect(resolution.primaryActions[1].id).toBe('pptx-to-png');
    expect(resolution.primaryActions[2].id).toBe('pptx-to-jpg');
    expect(resolution.primaryActions[3].id).toBe('pptx-extract-text');
    expect(resolution.summaryText).toBe('PowerPoint presentation detected · 3 slides');
  });
});
