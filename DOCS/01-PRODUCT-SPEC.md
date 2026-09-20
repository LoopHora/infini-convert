# Infini-Convert --- Product Specification

## 1. Identity

-   Brand: **LoopHora**
-   Product: **Infini-Convert**
-   Tagline: **Convert. Compress. Done.**
-   Product type: free, open-source, privacy-first browser utility
-   Primary platforms: mobile web + desktop web
-   V1 priority: image conversion, image compression, resize,
    image-to-PDF, PDF-to-image

## 2. Product Goal

Make file conversion and compression understandable in seconds.

The user should be able to:

1.  Open Infini-Convert.
2.  Select or drop a file.
3.  Choose the desired operation.
4.  Adjust compression if needed.
5.  Process the file.
6.  Download the result.

No account is required for the core product.

## 3. V1 Features

### Conversion

-   JPG/JPEG → PNG, WebP, AVIF
-   PNG → JPG/JPEG, WebP, AVIF
-   WebP → JPG/JPEG, PNG, AVIF
-   AVIF → JPG/JPEG, PNG where supported
-   HEIC → JPG/JPEG, PNG where supported
-   BMP/TIFF → common image formats where supported

### Compression

-   JPG/JPEG
-   PNG
-   WebP
-   AVIF where supported
-   Simple quality presets
-   Custom quality slider
-   Target file size such as 200 KB, 500 KB, 1 MB
-   Before/after size
-   Percentage saved
-   Batch compression

### Resize

-   Custom width/height
-   Keep aspect ratio
-   Presets such as 1080px, 1920px
-   Batch resize

### Image → PDF

-   Multiple images
-   Reorder
-   Rotate
-   A4 and common page sizes
-   Portrait/landscape
-   Margins
-   Quality/compression
-   Download PDF

### PDF → Image

-   PDF → JPG
-   PDF → PNG
-   Multi-page export
-   ZIP download for multiple pages

## 4. Non-Goals for V1

Do not build these before launch:

-   Login/accounts
-   Cloud storage
-   User dashboard
-   AI features
-   OCR
-   Full document conversion suite
-   Video conversion
-   Audio conversion
-   Paid APIs
-   Mobile native app
-   Complex admin system

## 5. Product Principles

### Simple

A normal user must not need technical knowledge.

### Local-first

If a conversion can safely run in the browser, process it locally.

### Honest privacy

Only claim local processing for tools that actually process locally.

### Fast

Load only the engine required for the selected operation.

### Accessible

Large controls, clear labels, keyboard support, readable contrast.

## 6. Success Criteria

V1 is successful when:

-   A new user can complete a common conversion without instructions.
-   Mobile and desktop both work.
-   Batch operations work reliably.
-   Compression provides meaningful size reduction.
-   Target-size compression is understandable.
-   Large files fail gracefully instead of freezing the UI.
-   The project can be open-sourced with dependency licenses documented.
