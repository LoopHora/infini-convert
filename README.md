# Infini-Convert

**Convert. Compress. Done.**

Infini-Convert is a browser-based file utility by **LoopHora** for common image conversion, compression, resizing, and image/PDF workflows. The application uses React, TypeScript, and Vite, with a responsive interface for desktop and mobile browsers.

> **Privacy note:** Infini-Convert is designed around browser-side processing for supported operations. Review the app's Privacy page and implementation for the behavior of a specific tool; do not assume every operation or third-party engine behaves identically.

## Features

### Image conversion

The project specification covers common image formats, with availability depending on browser and decoder/encoder support:

- JPEG / JPG
- PNG
- WebP
- AVIF
- HEIC / HEIF, where decoder support permits
- BMP / TIFF, where supported

### Image compression

- Quality presets and custom quality controls
- Target-size workflows, such as 200 KB, 500 KB, or 1 MB
- Before/after size information and percentage saved
- Batch compression where supported

The final size and quality depend on the input file, output format, engine, browser, and device. A target-size option should not be treated as a guarantee of an exact byte size unless the app explicitly confirms that result.

### Resize and crop

- Custom width and height
- Aspect-ratio handling
- Common size presets
- Batch workflows where supported
- Crop workflow

### Image and PDF tools

- Convert images to PDF
- Convert PDF pages to JPG or PNG
- Work with multi-page exports
- Download multiple outputs as a ZIP where supported

### PowerPoint tools

The application includes routes for:

- PPTX to PDF
- PPTX to PNG
- PPTX to JPG
- PPTX to text

Results can vary with document contents, the browser, and the rendering engine.

### Interface

- Responsive desktop and mobile layout
- File picker and drag-and-drop workflows
- Dedicated tool routes
- Downloadable results
- Privacy and About pages

Feature availability can change as the project evolves. Check the current application and tests for the exact formats and operations supported by a particular release.

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

The test script runs Vitest. Some browser-specific behavior may need additional manual testing in the browsers and devices you support.

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
