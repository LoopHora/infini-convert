# Infini-Convert --- Auto-Detect & Possible Actions

## Status

**LOCKED FOR V1**

Core principle:

> Drop a file. Infini-Convert figures out what you can do with it.

The feature must reduce decisions, not create a complicated dashboard.

## 1. Core workflow

``` text
Drop / Select File
        ↓
Detect Format + Basic Metadata
        ↓
Find Compatible Actions
        ↓
Show 3–5 Useful Actions
        ↓
User Chooses
        ↓
Local Processing
        ↓
Download
```

The user does not need to know technical conversion names.

## 2. Example: JPG

``` text
photo.jpg
4.2 MB • 4000 × 3000

What would you like to do?

[ Compress ]
Make the file smaller

[ Convert ]
PNG • WebP • AVIF

[ Resize ]
Change image dimensions

[ Create PDF ]
Turn image into a PDF
```

Do not show every technically possible action by default.

## 3. Example: HEIC

``` text
photo.HEIC
3.8 MB • 4032 × 3024

What would you like to do?

[ Convert to JPG ]
[ Convert to PNG ]
[ Compress ]
[ Resize ]
[ Create PDF ]
```

Less-common options go behind **More options →**.

## 4. Example: PDF

``` text
document.pdf
8.2 MB • 12 pages

What would you like to do?

[ Compress PDF ]
[ Convert to JPG ]
[ Convert to PNG ]
```

Never display actions that do not apply.

## 5. Multiple files

``` text
12 files selected

JPG × 8
PNG × 3
HEIC × 1

What would you like to do?

[ Compress all ]
[ Convert all → WebP ]
[ Resize all ]
[ Create one PDF ]
```

Calculate operations compatible with the whole selection.

If an operation cannot safely process every selected file, do not
present it as a one-click batch action.

## 6. Action ranking

Rank actions instead of dumping a list.

Suggested priorities:

1.  Most useful/common action for the detected format
2.  Compression
3.  Common conversion
4.  Resize
5.  PDF workflow
6.  Less-common options

Examples:

-   HEIC → JPG should be prominent.
-   Large image → Compression can be prominent.
-   Multiple images → Batch compression and Image → PDF can be
    prominent.

## 7. This is NOT an AI feature

Do not use an AI API.

Use deterministic local rules:

``` text
File
 ↓
MIME type
 ↓
Extension
 ↓
File signature where practical
 ↓
Metadata
 ↓
Conversion Registry
 ↓
Compatible Actions
```

This keeps detection free, fast, private and predictable.

## 8. File detection

Use browser APIs:

``` text
File.name
File.type
File.size
```

Read image dimensions where practical.

Read PDF page count where practical.

Do not trust the extension alone. Validate actual file signatures/magic
bytes where practical.

If the file cannot be identified reliably:

``` text
We couldn't identify this file reliably.
Please choose a supported format.
```

## 9. Conversion Registry

Auto-detection is powered by the central registry.

Conceptual type:

``` ts
type ToolDefinition = {
  id: string
  category: "convert" | "compress" | "resize" | "pdf"
  inputFormats: string[]
  outputFormats?: string[]
  label: string
  description: string
  supportsBatch: boolean
  processing: "local"
  priority?: number
}
```

Example:

``` ts
{
  id: "heic-to-jpg",
  category: "convert",
  inputFormats: ["heic"],
  outputFormats: ["jpg"],
  label: "Convert to JPG",
  description: "Create a widely compatible JPG",
  supportsBatch: true,
  processing: "local",
  priority: 100
}
```

## 10. Action Resolver

Conceptually:

``` ts
function getPossibleActions(files: DetectedFile[]) {
  const compatibleTools = registry.filter(tool =>
    isCompatible(tool, files)
  )

  return rankActions(compatibleTools)
}
```

For HEIC:

``` text
HEIC → JPG       ✓
HEIC → PNG       ✓
Compress image   ✓
Resize image     ✓
Image → PDF      ✓
PDF → JPG        ✕
```

Only compatible actions appear.

## 11. Compression integration

Compression is a first-class action.

``` text
photo.jpg
4.82 MB

What would you like to do?

⭐ Compress
   Make this file smaller

Convert
Resize
Create PDF
```

Compression supports:

-   Best quality
-   Balanced
-   Smallest
-   Custom quality
-   Target size
-   Batch compression

## 12. Target-size compression

Allow:

``` text
100 KB
200 KB
500 KB
1 MB
Custom
```

The engine searches for suitable quality/encoding parameters.

Show actual result:

``` text
Original: 4.82 MB
Result: 487 KB
Saved: 89.9%
```

Do not promise an exact byte size unless the implementation can
guarantee it.

## 13. Progressive disclosure

Default:

``` text
⭐ Compress
Convert
Resize
Create PDF
```

Advanced:

``` text
More options →
```

Advanced settings may include:

-   output format
-   quality
-   target size
-   dimensions
-   metadata options
-   PDF page settings

## 14. Drag-and-drop

Desktop:

``` text
Drag file
 ↓
Drop zone highlights
 ↓
Release
 ↓
Detection starts
```

Mobile uses the native file picker, followed by the same detection
workflow.

## 15. Privacy

Detection must happen locally.

The file should not be uploaded merely to determine:

-   file type
-   file size
-   image dimensions
-   PDF metadata needed for the UI

Preferred architecture:

``` text
File
 ↓
Browser Detector
 ↓
Action Resolver
 ↓
Local Processor
 ↓
Download
```

## 16. Mobile UX

Use vertical action cards with large tap targets:

``` text
photo.jpg
4.2 MB

What would you like to do?

[ Compress ]
Make the file smaller

[ Convert ]
PNG • WebP • AVIF

[ Resize ]
Change dimensions

[ Create PDF ]
```

No horizontal overflow.

## 17. Desktop UX

Desktop can use a two-column layout:

``` text
┌─────────────────────────────────────────────┐
│ File                         Possible actions│
│ photo.jpg                    [ Compress ]    │
│ 4.2 MB                       [ Convert ]     │
│ 4000×3000                    [ Resize ]      │
└─────────────────────────────────────────────┘
```

Same product, resolver and processing engine.

## 18. Error handling

Unsupported:

``` text
We don't support this file yet.

Try:
JPG
PNG
WebP
AVIF
HEIC
PDF
```

Corrupted:

``` text
This file appears to be damaged
or unreadable.

Try another file.
```

Very large:

``` text
This file is large and may take
longer on this device.
```

Never expose developer errors such as WASM memory errors.

## 19. Mixed-format batches

Example:

``` text
JPG
PNG
HEIC
```

If user chooses:

``` text
Convert all → WebP
```

each file uses the correct decoder and common WebP encoder.

If one fails:

``` text
10 of 11 files completed.

1 file could not be processed.

[ Download completed files ]
[ View failed file ]
```

Successful results must not be discarded.

## 20. Search + Auto-Detection

Two entry points use the same registry.

### File-first

``` text
Drop file
 ↓
Auto-detect
 ↓
Possible actions
```

### Task-first

``` text
Search "HEIC to JPG"
 ↓
HEIC → JPG tool
```

## 21. Performance

-   Heavy processing uses Web Workers.
-   Codecs are lazy-loaded.
-   Do not load every WASM engine on startup.
-   Release object URLs.
-   Clean workers after processing.
-   Avoid unnecessary large-memory copies.
-   Show progress for long jobs.

## 22. Testing

Test single files:

-   JPG
-   PNG
-   WebP
-   AVIF
-   HEIC
-   BMP
-   TIFF
-   PDF
-   unsupported
-   corrupted

Test multiple files:

-   same format
-   mixed image formats
-   large batch
-   one corrupted file among valid files

Verify:

1.  Correct detection.
2.  Only compatible actions.
3.  Sensible ranking.
4.  No impossible actions.
5.  Successful batch results survive individual failures.

## 23. AI IDE implementation prompt

``` text
Implement the Infini-Convert Auto-Detect & Possible Actions feature.

Requirements:
1. Detect selected/dropped files locally in the browser.
2. Create a typed DetectedFile model.
3. Read file name, size, MIME type, image dimensions and PDF page count where practical.
4. Never upload files for detection.
5. Use the existing Conversion Registry.
6. Create an Action Resolver.
7. Return only compatible actions.
8. Rank actions by priority.
9. Show 3–5 useful actions by default.
10. Put less-common actions behind "More options".
11. For multiple files, calculate operations compatible with the selection.
12. Support mixed image formats for common batch operations.
13. Preserve successful results if one batch item fails.
14. Do not use an AI API.
15. Use Web Workers for heavy processing.
16. Lazy-load conversion engines.
17. Build accessible responsive UI for mobile and desktop.
18. Add unit tests for detection and action resolution.
19. Add integration tests for single and multi-file flows.
20. Do not modify unrelated architecture.

UX goal:

Drop file → Infini-Convert understands it → choose what you need.

Keep the experience simple. Do not turn it into a dashboard.
```

## 24. Final flow

``` text
INFINI-CONVERT
      ↓
DROP / SELECT FILE
      ↓
AUTO DETECTION
      ↓
ACTION RESOLVER
      ↓
Compress / Convert / Resize / PDF
      ↓
Optional settings
      ↓
LOCAL PROCESSING
      ↓
RESULT
      ↓
DOWNLOAD
```

## Final rule

**Auto-detection is deterministic, not AI.**

The signature Infini-Convert experience is:

> **Drop it. We figure out the rest.**
