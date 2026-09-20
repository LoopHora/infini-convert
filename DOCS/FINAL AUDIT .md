# INFINI-CONVERT — FINAL PRE-LAUNCH DEEP AUDIT & ZERO-BUG CERTIFICATION

You are now acting as a SENIOR SOFTWARE AUDITOR, QA ENGINEER, SECURITY ENGINEER, PERFORMANCE ENGINEER, UX ENGINEER, and RELEASE ENGINEER.

Your job is NOT to redesign Infini-Convert.

Your job is to aggressively verify whether the CURRENT IMPLEMENTATION actually works.

DO NOT assume that something works because:
- the UI looks correct
- a button exists
- a feature is documented
- a function is named correctly
- a mock result appears
- a loading animation appears
- the code compiles
- one happy-path test succeeds

You must inspect the actual source code and test the real implementation.

==================================================
PRODUCT
==================================================

Product: Infini-Convert
Parent brand: LoopHora

Tagline:
"Convert. Compress. Done."

Core promise:
- Free
- Privacy-first
- Local/browser processing
- Zero server uploads for user files
- No mandatory account
- Mobile + desktop
- Simple universal file workflow

Core UX philosophy:

"Drop it. We figure out the rest."

Main workflow:

FILE
→ DETECT
→ DETERMINE COMPATIBLE ACTIONS
→ USER SELECTS ACTION
→ CONFIGURE
→ LOCAL PROCESSING
→ RESULT
→ DOWNLOAD

==================================================
IMPORTANT AUDIT RULE
==================================================

DO NOT modify code immediately.

FIRST:
1. Inspect the entire project.
2. Understand architecture.
3. Identify every feature.
4. Build an audit checklist.
5. Test each feature.
6. Record failures.
7. Determine root causes.
8. Only THEN propose fixes.

After the audit, fix issues systematically and retest.

Never mark something PASS merely because it appears to work.

==================================================
PHASE 1 — PROJECT RECONNAISSANCE
==================================================

Inspect:

- package.json
- lock file
- src/
- public/
- components
- pages
- routes
- hooks
- utilities
- workers
- WASM/codec modules
- conversion engines
- compression engines
- PDF engines
- configuration files
- TypeScript configuration
- Vite configuration
- Tailwind/configuration
- environment variables
- build scripts
- deployment configuration

Determine:

1. Application architecture
2. Entry point
3. Routing architecture
4. State management
5. File-processing architecture
6. Worker architecture
7. WASM architecture
8. Conversion registry
9. Auto-detection implementation
10. Download implementation
11. Error handling
12. Analytics
13. External network requests
14. Third-party dependencies
15. Browser APIs used

Create an architecture map.

==================================================
PHASE 2 — FEATURE INVENTORY
==================================================

Create a complete inventory of every user-facing feature.

At minimum audit:

HOME
CONVERT
COMPRESS
RESIZE
PDF
ABOUT
NAVIGATION
FILE PICKER
DRAG & DROP
AUTO DETECTION
ACTION RESOLUTION
SINGLE FILE PROCESSING
BATCH PROCESSING
DOWNLOAD
ERROR HANDLING
PROGRESS
CANCEL
RESET
RETRY
MOBILE WORKFLOW
DESKTOP WORKFLOW

Do not assume the list above is complete.

Discover additional functionality from the code.

==================================================
PHASE 3 — AUTO-DETECTION AUDIT
==================================================

Auto-detection is a CORE feature.

Verify that file detection is actually implemented.

Test:

.jpg
.jpeg
.png
.webp
.avif
.heic
.heif
.pdf

Also test:

- wrong extensions
- uppercase extensions
- mixed-case extensions
- missing extension
- MIME mismatch
- corrupted files
- zero-byte files
- unsupported files

Where practical, verify file signatures/magic bytes rather than trusting extensions alone.

For every detected file verify:

DETECTED TYPE
→ AVAILABLE ACTIONS
→ INVALID ACTIONS HIDDEN

Example:

JPEG:

✓ Compress
✓ Convert
✓ Resize
✓ Create PDF

Must NOT expose actions that cannot actually work.

Verify the Action Resolver against the Conversion Registry.

==================================================
PHASE 4 — CONVERSION AUDIT
==================================================

Test every conversion actually implemented by the application.

Do not rely on UI labels.

For each conversion:

INPUT
→ ENGINE
→ PROCESSING
→ OUTPUT BLOB
→ MIME TYPE
→ FILE EXTENSION
→ DOWNLOAD

Verify the output can actually be opened by an independent application/browser.

Test:

- normal files
- small files
- large files
- high-resolution files
- transparent images
- metadata-heavy files
- unusual filenames

Check that output is not merely renamed input data.

==================================================
PHASE 5 — COMPRESSION AUDIT
==================================================

Compression is a CORE feature.

Test:

- best quality
- high quality
- medium quality
- low quality
- extreme compression
- original format
- alternate output format
- batch compression

Verify:

1. Quality setting actually affects encoder.
2. Output is genuinely encoded.
3. Output file size changes appropriately.
4. Output remains valid.
5. Image dimensions are preserved unless explicitly changed.
6. Transparency behavior is correct.
7. User receives accurate before/after size.
8. Percentage saved is mathematically correct.

==================================================
TARGET-SIZE COMPRESSION
==================================================

Test:

100 KB
200 KB
500 KB
1 MB
custom target

Verify that target-size compression actually uses the target.

IMPORTANT:

Do NOT claim exact target size unless the algorithm guarantees it.

If target size is approximate, UI must communicate this accurately.

Test:

- impossible target sizes
- extremely small targets
- large images
- already-small images
- PNG
- JPEG
- WebP

==================================================
PHASE 6 — RESIZE AUDIT
==================================================

Test:

- width only
- height only
- width + height
- aspect-ratio preservation
- custom dimensions
- very small dimensions
- very large dimensions
- invalid dimensions
- zero
- negative
- decimal values
- extremely large values

Verify:

- actual pixel dimensions
- output dimensions
- quality
- orientation
- transparency

Ensure UI values correspond to actual output.

==================================================
PHASE 7 — PDF AUDIT
==================================================

Test Image → PDF.

Test:

- one image
- multiple images
- mixed image formats
- portrait
- landscape
- different dimensions
- transparent images
- large images

Verify:

- PDF opens correctly
- correct page count
- correct image placement
- no unexpected cropping
- no unexpected rotation
- acceptable quality
- reasonable file size
- correct filename
- correct download

If PDF → image exists, audit that too.

==================================================
PHASE 8 — BATCH PROCESSING
==================================================

Test:

1 file
5 files
10 files
25 files
50 files
100 files

Test:

- same format
- mixed formats
- duplicate names
- Unicode filenames
- spaces
- special characters
- one corrupted file among valid files

Verify:

- all valid files process
- failed files are reported
- successful files remain available
- processing doesn't stop unnecessarily
- progress is accurate
- filenames don't overwrite each other
- memory remains controlled

If ZIP download exists, verify ZIP integrity.

==================================================
PHASE 9 — DRAG & DROP
==================================================

Test:

- one file
- multiple files
- unsupported files
- mixed files
- rapid repeated drops
- drop while processing
- drop on mobile where unsupported

Verify:

- drag-over state
- drop state
- cancellation
- reset
- duplicate handling
- no accidental navigation

==================================================
PHASE 10 — FILE PICKER
==================================================

Test the actual browser file picker.

Verify:

- correct accepted types
- multiple selection
- mobile picker
- camera/photo picker where applicable
- unsupported file behavior

Do not trust accept="..." alone.

The application must validate selected files itself.

==================================================
PHASE 11 — DOWNLOAD AUDIT
==================================================

Verify every download.

Check:

- MIME type
- extension
- filename
- duplicate filenames
- Unicode names
- spaces
- special characters
- multiple downloads
- mobile download behavior
- object URL cleanup

Search the code for:

URL.createObjectURL()

and ensure appropriate:

URL.revokeObjectURL()

exists.

==================================================
PHASE 12 — ERROR HANDLING
==================================================

Intentionally break the application.

Test:

- corrupted file
- unsupported file
- empty file
- huge file
- invalid dimensions
- impossible target size
- conversion engine failure
- worker failure
- WASM loading failure
- browser API unavailable
- interrupted processing
- cancelled processing

The application must never leave the user with:

- blank screen
- frozen interface
- infinite spinner
- silent failure
- misleading success
- corrupted download

Every error must recover gracefully.

==================================================
PHASE 13 — PROCESS CANCELLATION
==================================================

If cancellation exists, test it.

Start a large operation.

Cancel midway.

Verify:

- worker terminates or stops
- processing actually stops
- memory is released
- UI returns to usable state
- partial output is not presented as final
- user can immediately start another operation

==================================================
PHASE 14 — MEMORY LEAK AUDIT
==================================================

This is extremely important because processing is local.

Inspect:

- ArrayBuffer
- Blob
- ImageBitmap
- Canvas
- Object URLs
- Workers
- WASM memory
- event listeners
- React effects
- subscriptions
- timers

Look for:

- missing cleanup
- workers never terminated
- object URLs never revoked
- repeated listeners
- stale state
- retained large files

Test repeated processing:

FILE
→ PROCESS
→ RESET
→ FILE
→ PROCESS
→ RESET

Repeat at least 10–20 times.

Verify memory does not continuously grow without reason.

==================================================
PHASE 15 — WEB WORKER / WASM AUDIT
==================================================

Verify:

- workers actually execute heavy processing
- main UI remains responsive
- workers terminate correctly
- WASM loads correctly
- lazy loading works
- failed WASM loading has a proper error
- assets resolve correctly in production
- no development-only paths are used

Check production deployment paths.

==================================================
PHASE 16 — PRIVACY / NETWORK AUDIT
==================================================

CORE PRODUCT PROMISE:

USER FILES MUST NOT BE UPLOADED TO A SERVER.

Inspect the entire codebase for:

fetch()
XMLHttpRequest
WebSocket
sendBeacon()
navigator.sendBeacon
FormData
third-party upload APIs
analytics
error tracking
external conversion APIs

Determine exactly what network requests occur.

Distinguish:

ALLOWED:
- website assets
- WASM/codecs
- privacy-safe analytics

NOT ALLOWED:
- uploading user files for conversion

Verify that the following never leave the browser unnecessarily:

- file contents
- filenames
- private metadata
- image data
- PDFs

If analytics exists, verify that it does not accidentally include file data.

==================================================
PHASE 17 — SECURITY AUDIT
==================================================

Look for:

- XSS
- unsafe HTML
- dangerouslySetInnerHTML
- unsafe URL handling
- path traversal assumptions
- malicious filenames
- SVG security problems
- dependency vulnerabilities
- exposed secrets
- unsafe external resources
- insecure postMessage handling
- worker message validation

Test malicious/untrusted filenames.

Do not assume browser-side processing automatically means "secure."

==================================================
PHASE 18 — DEPENDENCY AUDIT
==================================================

Inspect package.json.

Identify:

- unused dependencies
- duplicate dependencies
- outdated critical libraries
- unnecessary libraries
- packages with known vulnerabilities
- very large dependencies

Run appropriate package-manager audit commands.

Do not blindly upgrade dependencies.

Identify whether upgrades could break codecs or WASM.

==================================================
PHASE 19 — TYPESCRIPT AUDIT
==================================================

Run strict type checking.

Find:

- any
- unsafe casts
- ignored errors
- @ts-ignore
- @ts-expect-error
- unreachable code
- nullable state problems
- incorrect worker types
- incorrect Blob/MIME assumptions

Do not simply suppress TypeScript errors.

==================================================
PHASE 20 — REACT AUDIT
==================================================

Inspect:

- useEffect dependencies
- stale closures
- unnecessary rerenders
- state synchronization
- cleanup
- event handlers
- async race conditions
- component unmount behavior
- memory retention

Look for:

PROCESS A
starts
↓
PROCESS B
starts
↓
A finishes later
↓
A overwrites B

This type of race condition must be prevented.

==================================================
PHASE 21 — RESPONSIVE / MOBILE AUDIT
==================================================

Test at minimum:

320px
360px
375px
390px
414px
768px
1024px
1280px
1440px+

Check:

- no horizontal scrolling
- no clipped UI
- no overlapping elements
- no broken navigation
- no inaccessible controls
- readable text
- touch targets
- dialogs
- sliders
- dropdowns
- file cards
- progress indicators
- download controls

Test portrait and landscape.

==================================================
PHASE 22 — ACCESSIBILITY AUDIT
==================================================

Check:

- keyboard navigation
- focus states
- buttons
- labels
- form controls
- slider accessibility
- dialogs
- ARIA only where necessary
- semantic HTML
- color contrast
- screen-reader labels
- focus restoration

Every important operation must be possible without a mouse where reasonably expected.

==================================================
PHASE 23 — UX STATE AUDIT
==================================================

Every component must have correct states.

Audit:

IDLE
DRAGGING
FILE_SELECTED
DETECTING
READY
CONFIGURING
PROCESSING
SUCCESS
ERROR
CANCELLED
RESET

Make sure impossible state combinations cannot occur.

Examples:

- "Download" shown before processing finishes
- "Processing" shown after an error
- old result shown for new file
- wrong filename displayed
- progress stuck at 100%
- progress moving backwards unexpectedly

==================================================
PHASE 24 — ROUTING AUDIT
==================================================

Test every route.

For example:

/
 /convert
 /compress
 /resize
 /pdf
 /about

Test:

- navigation
- direct URL
- browser refresh
- back
- forward
- unknown route
- mobile navigation

Verify Cloudflare/static hosting compatibility.

==================================================
PHASE 25 — SEO AUDIT
==================================================

Inspect:

- title
- meta description
- canonical URL
- robots
- sitemap
- Open Graph
- Twitter metadata
- favicon
- semantic headings
- page-specific metadata
- crawlability

Do not add fake SEO content.

==================================================
PHASE 26 — PERFORMANCE AUDIT
==================================================

Measure:

- initial bundle
- JS size
- CSS size
- WASM size
- lazy-loaded chunks
- first load
- time to interactive
- processing startup
- main-thread blocking

Verify heavy conversion engines are not unnecessarily loaded on initial page load.

Goal:

LANDING PAGE
→ FAST

PROCESSING ENGINE
→ LOAD ONLY WHEN NEEDED

==================================================
PHASE 27 — ANALYTICS AUDIT
==================================================

If Cloudflare Web Analytics is installed:

Verify:

- analytics loads
- SPA navigation is measured
- no user files are transmitted
- no filenames are transmitted
- analytics doesn't break processing
- analytics failure doesn't break the application

If product usage analytics exists:

Verify only privacy-safe anonymous events are collected.

Never send actual file contents.

==================================================
PHASE 28 — PRODUCTION BUILD
==================================================

Run:

npm install
npm run build

and appropriate:

npm run lint
npm run typecheck
npm test

if available.

Then inspect the production output.

Do not consider development mode sufficient.

==================================================
PHASE 29 — PRODUCTION-SIMULATION TEST
==================================================

Run the actual production build locally.

Do NOT test only through the development server.

Test:

production build
→ serve production files
→ open browser
→ perform every major workflow

Verify:

- assets
- WASM
- workers
- routing
- downloads
- lazy loading
- error handling

==================================================
PHASE 30 — REGRESSION TEST
==================================================

After every fix:

1. Re-run the failed test.
2. Re-run the surrounding feature tests.
3. Re-run the complete critical-path suite.

Do not fix one thing and assume nothing else broke.

==================================================
CRITICAL USER JOURNEYS
==================================================

These must work from beginning to end.

JOURNEY 1:

Open website
→ drop JPG
→ detect JPG
→ choose Convert
→ PNG
→ process
→ download
→ open downloaded PNG

JOURNEY 2:

Open website
→ choose image
→ Compress
→ adjust quality
→ process
→ compare sizes
→ download

JOURNEY 3:

Image
→ Compress
→ target size
→ process
→ verify resulting size

JOURNEY 4:

Image
→ Resize
→ specify dimensions
→ process
→ verify actual dimensions

JOURNEY 5:

Multiple images
→ batch compression
→ process
→ download all

JOURNEY 6:

Multiple images
→ Image → PDF
→ process
→ open PDF
→ verify pages

JOURNEY 7:

Mobile browser
→ select image
→ detect
→ convert
→ download

JOURNEY 8:

Corrupted file
→ select
→ detect/process
→ graceful error
→ recover
→ process valid file

JOURNEY 9:

Large file
→ process
→ cancel
→ recover
→ process another file

JOURNEY 10:

Repeat processing 10–20 times
→ verify no progressive memory/UI degradation.

==================================================
FINAL VERDICT SYSTEM
==================================================

Use ONLY these statuses:

🟢 PASS
🟡 WARNING
🔴 FAIL
⚫ NOT TESTABLE

Definitions:

🟢 PASS
Verified through actual implementation/testing.

🟡 WARNING
Works, but has a non-critical issue or limitation.

🔴 FAIL
Does not work correctly or violates a core requirement.

⚫ NOT TESTABLE
Requires a real browser/device/environment/resource unavailable during the audit.

NEVER call something PASS simply because you inspected the code.

==================================================
AUDIT REPORT FORMAT
==================================================

Return:

# INFINI-CONVERT FINAL AUDIT

## 1. Executive Summary

Overall status:
READY / NOT READY

Critical blockers:
[number]

Warnings:
[number]

Passed:
[number]

Not testable:
[number]

---

## 2. Feature Matrix

| Feature | Status | Evidence | Problem | Required Fix |
|---|---|---|---|---|
| Auto-detection | | | | |
| JPG conversion | | | | |
| PNG conversion | | | | |
| WebP | | | | |
| AVIF | | | | |
| HEIC | | | | |
| Compression | | | | |
| Target-size compression | | | | |
| Resize | | | | |
| PDF | | | | |
| Batch | | | | |
| Download | | | | |
| Mobile | | | | |
| Privacy | | | | |
| Performance | | | | |
| Security | | | | |

---

## 3. Critical Bugs

For every critical bug:

### BUG-001
Severity:
Feature:
File:
Function/component:
Root cause:
How reproduced:
Expected:
Actual:
Fix:
Retest result:

---

## 4. Security Findings

---

## 5. Privacy Findings

---

## 6. Performance Findings

---

## 7. Mobile Findings

---

## 8. Accessibility Findings

---

## 9. Dependency Findings

---

## 10. Production Deployment Findings

---

## 11. Remaining Risks

Clearly separate:

KNOWN LIMITATIONS
from
ACTUAL BUGS.

Do not exaggerate minor limitations.

==================================================
FINAL RELEASE GATE
==================================================

Infini-Convert may be marked:

🟢 READY FOR RELEASE

ONLY IF:

- no critical functionality is broken
- no core privacy promise is violated
- no known security blocker exists
- core conversion paths work
- compression works
- resize works
- PDF works
- auto-detection works
- download works
- batch processing works if advertised
- mobile critical paths work
- production build works
- routing works
- no critical memory leak exists
- no critical race condition exists

If any core requirement fails:

🔴 NOT READY

Do NOT hide the failure.

Do NOT lower the standard.

Do NOT redesign the product to avoid testing the feature.

==================================================
MOST IMPORTANT INSTRUCTION
==================================================

BE ADVERSARIAL.

Your goal is to BREAK Infini-Convert before real users do.

Try unusual files.
Try invalid inputs.
Try huge inputs.
Try repeated operations.
Try rapid clicks.
Try cancellation.
Try mobile.
Try refresh.
Try back/forward.
Try corrupted files.
Try wrong extensions.
Try mixed batches.
Try production build.
Inspect network traffic.
Inspect memory cleanup.
Inspect workers.
Inspect WASM.
Inspect downloads.

If something breaks, FIND THE ROOT CAUSE.

Then fix it.

After fixing, TEST AGAIN.

Do not stop after finding the first bug.

Continue until the complete audit checklist has been exhausted.

The objective is NOT:

"Looks good."

The objective is:

"Every advertised function has been verified, every discovered defect has been fixed or explicitly documented, and the production build has passed the complete regression suite."

==================================================
END OF AUDIT PROMPT
==================================================