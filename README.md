# Infini-Convert

**Convert. Compress. Done.**

Infini-Convert is a high-performance, privacy-first browser-side file utility by **LoopHora** for instant file conversion, 4K PDF compression, image resizing, and document workflows supporting files up to **1 GB** (1,073,741,824 bytes). Built with React 19, TypeScript, and Vite, all processing executes **100% locally in your browser** with zero remote server uploads.

🌐 **Live Deployment:** [infini-convert.pages.dev](https://infini-convert.pages.dev/)

> **Privacy guarantee:** Infini-Convert operates entirely client-side. Your files never leave your device, ensuring total confidentiality for sensitive contracts, personal photos, and enterprise documents.

---

## Features

### 🚀 1 GB Large File Support & Memory-Optimized Engine
- **Universal 1 GB Limit:** Upload and process files up to 1 GB across all conversion, compression, and document tools.
- **Single-Decode Streaming:** Images and PDFs are decoded once and processed without redundant memory churn.
- **Active Memory Recycling:** Canvas backing stores and GPU buffers are immediately released (`canvas.width = 0; canvas.height = 0`) to prevent browser tab crashes.
- **Page-by-Page Cache Purging:** PDF.js page resources and font caches are purged per page (`page.cleanup()`) with cooperative event-loop yielding for smooth UI performance even on massive 500MB+ files.

### 📄 4K Ultra-HD PDF Compression
- **Quality Presets:**
  - **4K Ultra-HD (300 DPI):** Crystal-clear text and image crispness for professional printing and archiving.
  - **Best Quality (200 DPI):** High-fidelity compression for presentations and portfolios.
  - **Balanced (150 DPI):** Everyday document distribution and email sharing.
  - **Smallest Size:** Maximum shrinkage for strict size limits.
- **Custom Quality & Sharpness Tiers:** Interactive quality slider (5%–100%) combined with selectable resolution tiers (4K Ultra-HD, 2K High, Standard).
- **Target Size Mode:** Budget-driven compression with instant presets (`100 KB`, `200 KB`, `500 KB`, `1 MB`, `2 MB`, `5 MB`, `10 MB`) or custom target size inputs up to **1 GB**.
- **Auto-Detect Workspace:** Drop any PDF file on the homepage to automatically receive recommended compression and conversion actions.

### 🖼️ Image Conversion
Covers modern next-gen and legacy image formats with client-side decoders and encoders:
- JPEG / JPG
- PNG
- WebP (next-gen web efficiency)
- AVIF
- Apple HEIC / HEIF (decoded locally using `heic2any`)
- BMP / TIFF / GIF

### 🗜️ Image Compression
- Quality presets (`4k`, `best`, `balanced`, `smallest`) and custom slider (5%–100%)
- Target-size optimization with single-decode binary search
- Real-time before/after size calculation and savings percentage
- Batch compression with individual and ZIP package downloads

### 📐 Resize and Crop
- Dimension scaling with locked or unlocked aspect ratio
- Bounding box presets (`640px`, `1080px`, `1920px`, `2560px`, `3840px 4K`)
- Free-form interactive image crop with draggable bounding box

### 📑 Image & PDF Utilities
- **Images to PDF:** Convert single or multiple images into a combined PDF with custom page sizes (A4, Letter, Legal), margins, and orientations.
- **PDF to JPG / PNG:** Extract all pages or specific page ranges as high-resolution images.
- Multi-page image exports downloadable individually or as an uncompressed ZIP archive.

### 📊 PowerPoint Tools
- PPTX to PDF conversion
- PPTX to high-resolution PNG / JPG slide exports
- PPTX slide text extraction
- Multi-slide ZIP packaging

### 🎨 Universal Product Design
- Sleek dark and light theme system with curated HSL color tokens.
- Drag-and-drop universal dropzone with dynamic file size validation (`max 1.00 GB`).
- Responsive layouts engineered for mobile phones, tablets, and desktop displays.

## Tech stack

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [PDF.js](https://mozilla.github.io/pdf.js/) and [pdf-lib](https://pdf-lib.js.org/) for PDF-related workflows
- [JSZip](https://stuk.github.io/jszip/) for ZIP output
- [heic2any](https://github.com/alexcorvi/heic2any) for HEIC-related workflows
- [Cloudflare Pages](https://pages.cloudflare.com/) for static hosting

See `package.json` and `src/` for the current implementation and dependency list.

## Getting started

### Requirements

- Node.js **22.14.0 or newer**
- npm

The Node version requirement is recorded in the repository's version files and `package.json`.

### Install

```bash
git clone https://github.com/LoopHora/infini-convert.git
cd infini-convert
npm install
```

### Run the development server

```bash
npm run dev
```

Vite prints a local URL in the terminal. Open that URL in your browser.

### Build for production

```bash
npm run build
```

The build script runs TypeScript checking and then creates the Vite production bundle.

### Preview the production build

```bash
npm run preview
```

### Run tests
 
```bash
npm test
```
 
The test script runs Vitest (**100/100 tests passing** across 8 test suites covering dropzone validation, 1GB file limits, 4K PDF compression, aspect ratios, filename sanitization, format resolution, and codec conversions).

## Project structure

```text
.
├── DOCS/             # Product, architecture, UX, deployment and audit documentation
├── public/           # Static assets and public files
├── scripts/          # Project scripts
├── src/
│   ├── components/   # Shared UI components
│   ├── engine/       # File-processing engines
│   ├── pages/        # Tool and informational pages
│   ├── tests/        # Tests
│   ├── types/        # TypeScript types
│   ├── utils/        # Shared utilities
│   ├── App.tsx       # Application routes
│   └── main.tsx      # Application entry point
├── test-fixtures/    # Test fixtures
├── package.json
├── tsconfig.json
└── vite.config.ts
```

This is a simplified overview; see the repository for the complete source tree.

## Deployment

The project is configured for static frontend hosting with Cloudflare Pages.

Typical deployment workflow:

1. Push changes to the connected GitHub repository.
2. Allow the configured Cloudflare Pages build to run.
3. Review the deployment and build logs.
4. Smoke-test the homepage, changed tool routes, file processing, and downloads.

Use the existing Cloudflare Pages project settings as the source of truth for the production branch, build command, output directory, and custom domain. Confirm a deployment through its build logs and deployed site rather than assuming every push deployed successfully.

See [`DOCS/04-BUILD-DEPLOY-TEST.md`](DOCS/04-BUILD-DEPLOY-TEST.md) for the project's deployment and testing plan.

## Privacy and security

- Prefer browser-side processing for operations implemented locally.
- Validate file types and handle unsupported or malformed files gracefully.
- Do not upload files unless a feature clearly explains that remote processing is required.
- Release temporary object URLs and processing resources when they are no longer needed.
- Keep the Privacy page aligned with the actual runtime behavior.
- Never place credentials, private keys, or API secrets in frontend source code.
- Review third-party dependency licenses before redistribution.

Related project documentation:

- [Product specification](DOCS/01-PRODUCT-SPEC.md)
- [Technical architecture](DOCS/02-TECH-ARCHITECTURE.md)
- [UI/UX workflow](DOCS/03-UI-UX-WORKFLOW.md)
- [Build, deploy, and test plan](DOCS/04-BUILD-DEPLOY-TEST.md)

## Contributing

Contributions that improve reliability, usability, accessibility, performance, or documentation are welcome.

Before submitting a change:

1. Check existing documentation and Issues for related work.
2. Keep changes focused and explain the reason for them.
3. Add or update tests where practical.
4. Run `npm test` and `npm run build`.
5. Include reproduction steps and screenshots for user-interface changes.
6. Never commit secrets, private files, or real user documents.

For major feature changes, open an Issue first to discuss the intended behavior and implementation.

## Known limitations

- Format support can vary by browser and processing engine.
- Large files may exceed the memory or processing limits of a device.
- Some formats need codecs or rendering support that may not be available in every browser.
- Compression involves a quality/size trade-off; exact output sizes are not always possible.
- Supported functionality should be checked against the current release and test results.

## License

The repository's `package.json` contains an `ISC` package metadata field, but a root-level `LICENSE` file was not present in the repository listing when this README was prepared. Package metadata alone should not be treated as a clear repository-wide license grant.

**Before inviting the public to reuse, modify, or redistribute this project, add a root-level `LICENSE` file that reflects the maintainer's intended terms.** Until a clear license is included, do not assume others have permission to reuse the repository.

## Project

- **Brand:** LoopHora
- **Product:** Infini-Convert
- **Tagline:** Convert. Compress. Done.
- **Repository:** [LoopHora/infini-convert](https://github.com/LoopHora/infini-convert)
