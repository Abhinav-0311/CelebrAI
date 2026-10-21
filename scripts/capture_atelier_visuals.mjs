import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const projectScreenshotsDir = path.join(rootDir, 'screenshots');
const artifactScreenshotsDir = path.join(
  'C:\\Users\\Abhinav Jain\\.gemini\\antigravity\\brain\\9ba10421-157f-45a5-a340-5448d4564564',
  'screenshots'
);

[projectScreenshotsDir, artifactScreenshotsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function saveScreenshot(target, filename, fullPage = false) {
  const p1 = path.join(projectScreenshotsDir, filename);
  await target.screenshot({ path: p1, fullPage });
  if (fs.existsSync(path.dirname(artifactScreenshotsDir))) {
    const p2 = path.join(artifactScreenshotsDir, filename);
    await target.screenshot({ path: p2, fullPage });
  }
  console.log(`✓ [Visual Evidence Captured] ${filename}`);
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // server starting up
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} failed to respond within ${timeoutMs}ms`);
}

async function runCapture() {
  console.log('🎨 Starting Comprehensive Atelier Visual Evidence Capture with Playwright...\n');
  
  const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
  const serverProcess = spawn('node', [viteBin, 'preview', '--port', '4173'], {
    cwd: rootDir,
    stdio: 'pipe',
  });

  const baseUrl = 'http://localhost:4173';

  try {
    await waitForServer(baseUrl);
    console.log(`✓ Production preview server active on ${baseUrl}\n`);

    const browser = await chromium.launch({ headless: true });

    // ─────────────────────────────────────────────────────────────
    // 1. CORPORATE GALA — DESKTOP (1440 × 900)
    // ─────────────────────────────────────────────────────────────
    console.log('--- 1. Desktop Overview (Corporate Gala: 1440 × 900) ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(baseUrl, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(500);

    // Save Desktop Overview
    await saveScreenshot(desktopPage, 'screenshot_overview_corporate_desktop.png', false);
    await saveScreenshot(desktopPage, 'screenshot_overview_atelier_desktop.png', false);

    // Save isolated Corporate Gala Poster
    const galaPoster = desktopPage.locator('section[aria-label="Event Poster"]');
    if (await galaPoster.isVisible()) {
      await saveScreenshot(galaPoster, 'screenshot_poster_corporate.png');
    }

    // ─────────────────────────────────────────────────────────────
    // 2. ADAPTIVE REVIEW — DESKTOP (1440 × 900)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Adaptive Review Modal (Desktop: 1440 × 900) ---');
    const guestInputDesktop = desktopPage.locator('#adjust-guests');
    await guestInputDesktop.fill('180');
    const rippleBtnDesktop = desktopPage.locator('button:has-text("Ripple")').first();
    await rippleBtnDesktop.click();

    const desktopModal = desktopPage.locator('div[role="dialog"]');
    await desktopModal.waitFor({ state: 'visible', timeout: 5000 });
    await desktopPage.waitForTimeout(400);

    await saveScreenshot(desktopPage, 'screenshot_adaptive_review_desktop.png', false);
    await saveScreenshot(desktopPage, 'screenshot_adaptive_review_atelier.png', false);

    // Dismiss modal
    await desktopPage.keyboard.press('Escape');
    await desktopContext.close();

    // ─────────────────────────────────────────────────────────────
    // 3. MOBILE OVERVIEW & ADAPTIVE REVIEW (390 × 844)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Mobile Overview & Adaptive Review (390 × 844) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(baseUrl, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);

    // Save Mobile Overview
    await saveScreenshot(mobilePage, 'screenshot_overview_mobile_390.png', false);
    await saveScreenshot(mobilePage, 'screenshot_overview_atelier_mobile.png', false);

    // Open and Save Mobile Adaptive Review Modal
    const guestInputMobile = mobilePage.locator('#adjust-guests');
    await guestInputMobile.fill('175');
    const rippleBtnMobile = mobilePage.locator('button:has-text("Ripple")').first();
    await rippleBtnMobile.click();

    const mobileModal = mobilePage.locator('div[role="dialog"]');
    await mobileModal.waitFor({ state: 'visible', timeout: 5000 });
    await mobilePage.waitForTimeout(400);

    await saveScreenshot(mobilePage, 'screenshot_adaptive_review_mobile.png', false);
    await mobilePage.keyboard.press('Escape');
    await mobileContext.close();

    // ─────────────────────────────────────────────────────────────
    // 4. COMPACT MOBILE OVERVIEW (320 × 600)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Compact Mobile Overview (320 × 600) ---');
    const compactContext = await browser.newContext({
      viewport: { width: 320, height: 600 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const compactPage = await compactContext.newPage();
    await compactPage.goto(baseUrl, { waitUntil: 'networkidle' });
    await compactPage.waitForTimeout(500);

    await saveScreenshot(compactPage, 'screenshot_overview_mobile_320.png', false);
    await compactContext.close();

    // ─────────────────────────────────────────────────────────────
    // 5. WEDDING POSTER GENERATION (Warm Ivory Stationery & Botanical)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Generating Wedding Celebration (Warm Ivory Art Direction) ---');
    const weddingContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const weddingPage = await weddingContext.newPage();
    await weddingPage.goto(baseUrl, { waitUntil: 'networkidle' });

    // Open Event Creation Wizard
    const planBtn1 = weddingPage.locator('button[aria-label="Create new celebration plan"]');
    await planBtn1.click();
    const createModal1 = weddingPage.locator('div[role="dialog"]');
    await createModal1.waitFor({ state: 'visible', timeout: 5000 });

    await weddingPage.fill('#evt-title', 'Villa d’Este Serenade');
    await weddingPage.selectOption('#evt-type', 'wedding');
    await weddingPage.selectOption('#venue-type', 'garden');
    await weddingPage.fill('#guest-count', '130');
    await weddingPage.fill('#total-budget', '48000');
    await weddingPage.fill('#evt-date', '2027-06-20');
    await weddingPage.fill('#evt-location', 'Lake Como Botanical Villa, Italy');

    const submitBtn1 = createModal1.locator('button[type="submit"]');
    await submitBtn1.click();
    await createModal1.waitFor({ state: 'hidden', timeout: 25000 });
    await weddingPage.waitForTimeout(600);

    const weddingPoster = weddingPage.locator('section[aria-label="Event Poster"]');
    await weddingPoster.waitFor({ state: 'visible', timeout: 5000 });
    await saveScreenshot(weddingPoster, 'screenshot_poster_wedding.png');
    await weddingContext.close();

    // ─────────────────────────────────────────────────────────────
    // 6. BIRTHDAY POSTER GENERATION (Graphic Display & Color Blocks)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. Generating Birthday Soirée (Graphic Poster Art Direction) ---');
    const birthdayContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const birthdayPage = await birthdayContext.newPage();
    await birthdayPage.goto(baseUrl, { waitUntil: 'networkidle' });

    const planBtn2 = birthdayPage.locator('button[aria-label="Create new celebration plan"]');
    await planBtn2.click();
    const createModal2 = birthdayPage.locator('div[role="dialog"]');
    await createModal2.waitFor({ state: 'visible', timeout: 5000 });

    await birthdayPage.fill('#evt-title', 'Studio 54 Midnight Jubilee');
    await birthdayPage.selectOption('#evt-type', 'birthday');
    await birthdayPage.selectOption('#venue-type', 'rooftop');
    await birthdayPage.fill('#guest-count', '85');
    await birthdayPage.fill('#total-budget', '22000');
    await birthdayPage.fill('#evt-date', '2027-09-12');
    await birthdayPage.fill('#evt-location', 'Skyline Penthouse Loft, Manhattan');

    const submitBtn2 = createModal2.locator('button[type="submit"]');
    await submitBtn2.click();
    await createModal2.waitFor({ state: 'hidden', timeout: 25000 });
    await birthdayPage.waitForTimeout(600);

    const birthdayPoster = birthdayPage.locator('section[aria-label="Event Poster"]');
    await birthdayPoster.waitFor({ state: 'visible', timeout: 5000 });
    await saveScreenshot(birthdayPoster, 'screenshot_poster_birthday.png');
    await birthdayContext.close();

    await browser.close();
    console.log('\n🎉 All 8 Visual Evidence Assets successfully captured and synced to brain artifacts!');
  } finally {
    serverProcess.kill('SIGTERM');
  }
}

runCapture().catch((err) => {
  console.error('Capture flow failed:', err);
  process.exit(1);
});
