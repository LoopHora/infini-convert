# Infini-Convert --- Technical Architecture

## 1. Core Stack

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   React Router
-   Web Workers
-   WebAssembly
-   Browser File/Blob APIs
-   GitHub
-   Cloudflare Pages for static hosting

## 2. Existing Engines --- Do Not Build Codecs From Scratch

Use established open-source libraries.

### Images

Use browser/WebAssembly codecs such as the jSquash/Squoosh ecosystem for
JPEG, PNG, WebP, AVIF and resizing.

Useful packages can include:

-   @jsquash/jpeg
-   @jsquash/png
-   @jsquash/webp
-   @jsquash/avif
-   @jsquash/resize
-   @jsquash/oxipng

Verify current package versions and licenses before installation.

### HEIC

Use an existing browser-compatible HEIC decoder such as `heic-to` where
its current browser support and license meet project requirements.

### PDF

Use:

-   `pdf-lib` for PDF creation/manipulation
-   `pdfjs-dist` / PDF.js for PDF rendering

### ZIP

Use an established browser-compatible ZIP library for multi-file
downloads.

## 3. Processing Model

Preferred model:

``` text
User
  ↓
React UI
  ↓
File selected
  ↓
Conversion Registry
  ↓
Web Worker
  ↓
WASM / browser engine
  ↓
Blob
  ↓
Download
```

Do not upload files to a server for operations designed to be local.

## 4. Web Workers

Heavy processing must not run directly in the React main thread.

Example:

``` text
React
 ├── Worker: image conversion
 ├── Worker: compression
 ├── Worker: resize
 └── Worker: PDF rendering/processing
```

Workers communicate using messages.

The UI receives:

-   started
-   progress
-   completed
-   error
-   cancelled

## 5. Lazy Loading

Do not ship every codec in the initial JavaScript bundle.

Example:

``` text
User chooses HEIC → JPG
        ↓
Load HEIC engine
        ↓
Process
```

Example:

``` text
User chooses PNG → WebP
        ↓
Load WebP encoder
        ↓
Process
```

This keeps initial page load small.

## 6. Conversion Registry

Create one central registry rather than hard-coding every tool.

Conceptual shape:

``` ts
type ConversionTool = {
  id: string
  category: "convert" | "compress" | "resize" | "pdf"
  inputFormats: string[]
  outputFormats: string[]
  engine: string
  processing: "local"
  supportsBatch: boolean
}
```

Example:

``` ts
{
  id: "heic-to-jpg",
  category: "convert",
  inputFormats: ["heic"],
  outputFormats: ["jpg"],
  engine: "heic",
  processing: "local",
  supportsBatch: true
}
```

The registry powers:

-   UI
-   routing
-   search
-   supported-format detection
-   related tools
-   SEO pages

## 7. Suggested Project Structure

``` text
src/
├── app/
│   ├── router/
│   └── providers/
├── components/
│   ├── FileDropzone/
│   ├── FileList/
│   ├── Progress/
│   ├── CompressionControls/
│   ├── ResultCard/
│   └── DownloadButton/
├── features/
│   ├── convert/
│   ├── compress/
│   ├── resize/
│   ├── image-to-pdf/
│   └── pdf-to-image/
├── engine/
│   ├── registry/
│   ├── codecs/
│   ├── pdf/
│   └── workers/
├── pages/
│   ├── Home/
│   ├── Tool/
│   ├── Privacy/
│   └── About/
├── utils/
└── types/
```

## 8. Storage

V1 needs no database.

Do not store user files on a server.

Temporary browser memory/object URLs should be released after
processing.

## 9. Security

-   Validate file type and extension.
-   Do not trust filenames.
-   Enforce reasonable file-size limits.
-   Revoke object URLs.
-   Avoid executing user-provided content.
-   Keep dependencies updated.
-   Audit third-party licenses.
-   Never describe a local tool as local if it uploads files.

## 10. Hosting

Deploy the static frontend to Cloudflare Pages.

``` text
GitHub
  ↓
Cloudflare Pages
  ↓
Global static delivery
  ↓
Browser
```

The initial architecture avoids backend compute and file-storage costs.
