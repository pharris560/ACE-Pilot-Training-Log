/**
 * screenshot.mjs — macOS-compatible screenshot tool using Puppeteer
 * Usage: node screenshot.mjs <url> [label]
 * Saves to: ./temporary screenshots/screenshot-N[-label].png
 */
import { mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, 'temporary screenshots');

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Ensure screenshots dir exists
await mkdir(screenshotsDir, { recursive: true });

// Auto-increment filename
const existing = existsSync(screenshotsDir)
  ? (await readdir(screenshotsDir)).filter(f => f.endsWith('.png'))
  : [];
const nextN = existing.length + 1;
const filename = label
  ? `screenshot-${nextN}-${label}.png`
  : `screenshot-${nextN}.png`;
const outputPath = join(screenshotsDir, filename);

// Try to use puppeteer
let puppeteer;
try {
  puppeteer = (await import('puppeteer')).default;
} catch {
  // Try global puppeteer locations
  try {
    puppeteer = (await import('/usr/local/lib/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js')).default;
  } catch {
    console.error('Puppeteer not found. Install with: npm install puppeteer');
    process.exit(1);
  }
}

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await page.screenshot({ path: outputPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outputPath}`);
