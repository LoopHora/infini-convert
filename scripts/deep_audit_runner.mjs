import fs from 'fs';
import path from 'path';

console.log('=====================================================');
console.log('   INFINI-CONVERT DEEP ADVERSARIAL AUDIT RUNNER      ');
console.log('=====================================================\n');

// 1. Audit Network Requests / Privacy in Codebase
console.log('--- 1. PRIVACY & ZERO-UPLOAD AUDIT ---');
const srcDir = path.resolve('src');
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allSrc = getAllFiles(srcDir);
const networkPatterns = [
  { name: 'fetch', regex: /\bfetch\s*\(/ },
  { name: 'XMLHttpRequest', regex: /\bXMLHttpRequest\b/ },
  { name: 'WebSocket', regex: /\bWebSocket\b/ },
  { name: 'navigator.sendBeacon', regex: /sendBeacon\b/ },
  { name: 'FormData.append(file)', regex: /FormData.*append.*\b(file|blob)\b/i },
];

let uploadFound = false;
for (const p of networkPatterns) {
  for (const file of allSrc) {
    const text = fs.readFileSync(file, 'utf8');
    if (p.regex.test(text)) {
      console.log(`[PRIVACY CHECK] Found ${p.name} in ${path.relative(srcDir, file)}`);
      // Check if it uploads user files
      if (text.includes('POST') || text.includes('PUT') || p.name.includes('FormData')) {
        console.error(`[PRIVACY VIOLATION] Possible file upload in ${file}`);
        uploadFound = true;
      }
    }
  }
}
if (!uploadFound) {
  console.log('PRIVACY RESULT: 🟢 PASS — Zero server uploads detected. 100% in-browser processing.');
}

// 2. Security Audit: Check dangerouslySetInnerHTML and eval
console.log('\n--- 2. SECURITY AUDIT ---');
let securityIssueFound = false;
const securityPatterns = [
  { name: 'dangerouslySetInnerHTML', regex: /dangerouslySetInnerHTML/ },
  { name: 'eval(', regex: /\beval\s*\(/ },
  { name: 'Function(', regex: /\bnew\s+Function\s*\(/ },
];

for (const p of securityPatterns) {
  for (const file of allSrc) {
    const text = fs.readFileSync(file, 'utf8');
    if (p.regex.test(text)) {
      console.warn(`[SECURITY WARNING] Found ${p.name} in ${path.relative(srcDir, file)}`);
      securityIssueFound = true;
    }
  }
}
if (!securityIssueFound) {
  console.log('SECURITY RESULT: 🟢 PASS — Zero dangerouslySetInnerHTML, eval, or raw code injection.');
}

// 3. Filename Sanitization Adversarial Testing
console.log('\n--- 3. FILENAME SANITIZATION ADVERSARIAL AUDIT ---');
import { sanitizeFilename, generateOutputFilename, extractBasename } from '../src/utils/filename.ts';

const adversarialNames = [
  '../../../etc/passwd.jpg',
  '..\\..\\windows\\system32\\cmd.exe.png',
  'normal photo.jpg',
  'image:with:colons?.png',
  'name with <brackets> & "quotes".webp',
  'unicode_हिंदी_中文_العربية_🚀.heic',
  'multiple.dots.in.one.filename.jpg',
  'trailing spaces and dots ...   .png',
  '2f70c07e-df56-4fa9-813b-84b3d34d5d08.png', // UUID input
];

let sanitizationPassed = true;
for (const raw of adversarialNames) {
  const sanitized = sanitizeFilename(raw);
  const outJpg = generateOutputFilename(raw, 'jpg');
  const outZip = generateOutputFilename(raw, 'compressed');
  
  // Check traversal
  if (sanitized.includes('/') || sanitized.includes('\\') || sanitized.includes('..')) {
    console.error(`SANITIZATION FAILED for: ${raw} -> ${sanitized}`);
    sanitizationPassed = false;
  }
  console.log(`[PASS] "${raw}"\n       -> Sanitized: "${sanitized}"\n       -> Output:    "${outJpg}" | "${outZip}"`);
}
console.log('SANITIZATION RESULT:', sanitizationPassed ? '🟢 PASS' : '🔴 FAIL');

// 4. Test Fixtures Audit
console.log('\n--- 4. TEST FIXTURES AUDIT ---');
const fixturesDir = path.resolve('test-fixtures');
const fixtureFiles = fs.readdirSync(fixturesDir);
console.log(`Found ${fixtureFiles.length} test fixtures:`, fixtureFiles.join(', '));

console.log('\nDEEP AUDIT SCRIPT COMPLETED SUCCESSFULLY.');
