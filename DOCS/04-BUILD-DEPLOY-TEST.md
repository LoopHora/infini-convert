# Infini-Convert --- Build, Deploy & Test Plan

## 1. Build Order

Do not build everything at once.

### Step 1 --- Project

Create:

``` text
React + TypeScript + Vite
```

Install styling and routing.

Create the base layout.

### Step 2 --- File System

Implement:

-   file picker
-   drag and drop
-   file validation
-   file list
-   remove
-   clear all

### Step 3 --- Conversion Registry

Create the central registry before adding many tools.

Add one working conversion end-to-end.

### Step 4 --- Worker System

Create a generic worker interface.

Conceptual API:

``` text
start
progress
complete
error
cancel
```

### Step 5 --- Image Engines

Implement and test:

1.  JPG → PNG
2.  PNG → JPG
3.  JPG → WebP
4.  PNG → WebP
5.  WebP → JPG
6.  AVIF where supported
7.  HEIC → JPG/PNG

### Step 6 --- Compression

Implement:

-   quality presets
-   quality slider
-   target size
-   before/after statistics
-   batch compression

### Step 7 --- Resize

Implement:

-   width
-   height
-   aspect ratio
-   presets
-   batch

### Step 8 --- PDF

Implement:

-   image → PDF
-   multiple images → PDF
-   reorder
-   rotate
-   A4
-   PDF → JPG
-   PDF → PNG
-   ZIP output

PDF compression should be treated as a separate technical milestone
because its quality/size tradeoffs are more complex.

## 2. Testing Matrix

Every tool needs tests for:

### File types

-   valid file
-   wrong extension
-   corrupted file
-   empty file

### Size

-   tiny file
-   normal file
-   large file

### Batch

-   1 file
-   5 files
-   20 files
-   mixed dimensions

### Devices

-   iPhone Safari
-   Android Chrome
-   desktop Chrome
-   desktop Firefox
-   desktop Safari
-   desktop Edge

### UI

-   slow processing
-   cancelled processing
-   conversion failure
-   download failure

## 3. Compression Tests

For each supported format:

``` text
Original
↓
Compression setting
↓
Output size
↓
Visual quality
↓
Processing time
```

Record representative examples.

Do not optimize only for file size.

## 4. Performance

Measure:

-   first page load
-   time until interactive
-   engine load time
-   conversion time
-   memory use
-   batch processing time

Use lazy-loaded engines.

## 5. Deployment

Repository:

``` text
GitHub
```

Deployment:

``` text
GitHub
  ↓
Cloudflare Pages
```

Every push to the production branch should deploy automatically.

## 6. Environment Variables

V1 should require as few secrets as possible.

The core converter should work without:

-   API keys
-   database credentials
-   storage credentials

## 7. Production Checklist

Before launch:

-   [ ] All core conversions work
-   [ ] Compression works
-   [ ] Target size works
-   [ ] Batch works
-   [ ] ZIP download works
-   [ ] Mobile works
-   [ ] Desktop works
-   [ ] Error handling works
-   [ ] No accidental file uploads
-   [ ] Privacy statement matches actual architecture
-   [ ] Dependency licenses checked
-   [ ] Favicon
-   [ ] Open Graph metadata
-   [ ] Sitemap
-   [ ] robots.txt
-   [ ] 404 page
-   [ ] HTTPS
-   [ ] README
-   [ ] Source repository ready

## 8. Definition of Done

A feature is not finished because the conversion works once.

It is finished when:

-   the UI is understandable
-   errors are handled
-   mobile works
-   desktop works
-   batch behavior is correct
-   large inputs fail gracefully
-   downloads work
-   memory is released
-   the operation has been tested in supported browsers

## 9. AI IDE Rule

Give the AI IDE small tasks.

Bad:

``` text
Build the entire Infini-Convert platform.
```

Good:

``` text
Implement the generic FileDropzone component.
Do not modify unrelated files.
Add TypeScript types.
Add validation for supported image files.
Return a list of selected files to the parent.
```

Build one module at a time and test after each milestone.
