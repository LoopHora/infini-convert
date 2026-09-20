# Infini-Convert --- UI/UX Workflow

## 1. Design Rule

The product must never feel like university software.

A first-time user should understand the screen immediately.

Primary actions:

-   Convert
-   Compress
-   Resize

Supporting workflows:

-   Image → PDF
-   PDF → Image

## 2. Homepage

Desktop:

``` text
LoopHora

INFINI-CONVERT

Convert. Compress. Done.

[ Drop files here ]
[ Choose Files ]

Convert     Compress     Resize
Image → PDF     PDF → Image
```

Mobile uses the same hierarchy vertically.

## 3. File-First Flow

After a file is selected:

``` text
photo.HEIC
2.8 MB
3024 × 4032

What do you want to do?

[ Convert to JPG ]
[ Compress ]
[ Resize ]
[ Make PDF ]
```

Do not force the user to understand codecs.

## 4. Conversion Flow

``` text
Select file
  ↓
Detect format
  ↓
Choose output
  ↓
Optional settings
  ↓
Convert
  ↓
Result
  ↓
Download
```

Example:

``` text
photo.png

Convert to:
[ WebP ▼ ]

[ CONVERT ]
```

## 5. Compression Flow

Compression is a first-class feature.

``` text
photo.jpg
4.82 MB

Quality
Best ───────●──── Small

Quality: 72%

Target size
[ 500 KB ]

Estimated result: ~480 KB

[ COMPRESS ]
```

Provide simple presets:

-   Best quality
-   Balanced
-   Smallest

Provide Custom mode for advanced users.

## 6. Target Size

User can specify:

-   100 KB
-   200 KB
-   500 KB
-   1 MB
-   2 MB
-   custom

The application searches for suitable encoding parameters.

Do not guarantee an exact byte size unless the algorithm actually
guarantees it.

Show:

``` text
Original: 4.82 MB
Result: 487 KB
Saved: 89.9%
```

## 7. Preview

For image compression, provide an optional before/after comparison.

Do not make the preview block the main interaction.

The main interaction remains:

``` text
settings → compress → download
```

## 8. Batch Flow

``` text
Drop 20 images
  ↓
Choose operation
  ↓
Set settings once
  ↓
Process all
  ↓
Download ZIP
```

Example:

``` text
20 files

Output: WebP
Quality: 70%

[ CONVERT 20 FILES ]
```

## 9. Image → PDF Flow

``` text
Drop images
  ↓
Thumbnail list
  ↓
Reorder
  ↓
Rotate/remove
  ↓
Page size: A4
  ↓
Orientation
  ↓
Margins
  ↓
Quality
  ↓
Create PDF
```

## 10. PDF → Image

``` text
Select PDF
  ↓
Choose JPG/PNG
  ↓
Choose pages:
All / Selected
  ↓
Quality
  ↓
Convert
  ↓
Download image or ZIP
```

## 11. Result Screen

Always show:

``` text
✓ Done

Original: 4.82 MB
Result: 487 KB

[ DOWNLOAD ]

[ Adjust settings ]
[ Convert another ]
```

## 12. Errors

Never expose technical errors.

Instead:

``` text
We couldn't process this file.

Possible reasons:
• Unsupported format
• Corrupted file
• File is too large for this device
• Browser limitation

[ Try another file ]
```

## 13. Desktop

Use the extra width for:

-   larger drop zone
-   side-by-side preview
-   file list + settings panel

Do not create a completely different product.

## 14. Mobile

Priorities:

1.  Choose file
2.  Select action
3.  Adjust
4.  Process
5.  Download

Buttons should be easy to tap.

## 15. Accessibility

-   Keyboard navigation
-   Visible focus states
-   Labels for controls
-   Screen-reader-friendly buttons
-   Do not rely only on icons
-   Clear progress state

## 16. Visual Style

LoopHora should feel modern and premium but restrained.

Avoid:

-   excessive gradients
-   excessive animations
-   huge dashboards
-   technical jargon
-   crowded cards

The converter itself should dominate the page.
