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

async function saveScreenshot(page, filename, fullPage = false) {
  const p1 = path.join(projectScreenshotsDir, filename);
  await page.screenshot({ path: p1, fullPage });
  if (fs.existsSync(path.dirname(artifactScreenshotsDir))) {
    const p2 = path.join(artifactScreenshotsDir, filename);
    await page.screenshot({ path: p2, fullPage });
  }
  console.log(`[Visual Evidence Captured] ${filename}`);
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
  console.log('🎨 Starting Atelier Visuals Capture with Playwright...');
  
  const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
  const serverProcess = spawn('node', [viteBin, 'preview', '--port', '4173'], {
    cwd: rootDir,
    stdio: 'pipe',
  });

  const baseUrl = 'http://localhost:4173';

  try {
    await waitForServer(baseUrl);
    console.log(`✓ Production preview server active on ${baseUrl}`);

    const browser = await chromium.launch({ headless: true });

    // 1. Desktop Viewport (1440x900)
    console.log('\n--- 1. Capturing Desktop Overview (The Event Atelier) ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2, // Retina 2x crispness
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(baseUrl, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(600);

    // Save Desktop Overview
    await saveScreenshot(desktopPage, 'screenshot_overview_atelier_desktop.png', false);

    // 2. Open Adaptive Review Modal (Before -> After Panel)
    console.log('\n--- 2. Capturing Adaptive Review Modal (The Event Atelier) ---');
    // Change guest input in quick-adjust and click ripple
    const guestInput = desktopPage.locator('#adjust-guests');
    await guestInput.fill('180');
    
    // Click the Ripple button next to the input
    const rippleBtn = desktopPage.locator('button:has-text("Ripple")').first();
    await rippleBtn.click();

    // Wait for the modal dialog to appear
    const modalDialog = desktopPage.locator('div[role="dialog"]');
    await modalDialog.waitFor({ state: 'visible', timeout: 5000 });
    await desktopPage.waitForTimeout(400);

    // Save Adaptive Review Modal
    await saveScreenshot(desktopPage, 'screenshot_adaptive_review_atelier.png', false);

    await desktopContext.close();

    // 3. Mobile Viewport (iPhone 14 / Pro: 390x844)
    console.log('\n--- 3. Capturing Mobile Overview (The Event Atelier) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(baseUrl, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(600);

    // Save Mobile Overview
    await saveScreenshot(mobilePage, 'screenshot_overview_atelier_mobile.png', false);

    await mobileContext.close();
    await browser.close();

    console.log('\n✨ All Atelier Visual Evidence successfully captured and copied to brain artifacts!');
  } finally {
    serverProcess.kill('SIGTERM');
  }
}

runCapture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
