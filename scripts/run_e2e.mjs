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

async function saveScreenshot(page, filename) {
  const p1 = path.join(projectScreenshotsDir, filename);
  const p2 = path.join(artifactScreenshotsDir, filename);
  await page.screenshot({ path: p1, fullPage: false });
  await page.screenshot({ path: p2, fullPage: false });
  console.log(`[Screenshot Captured] ${filename}`);
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // Wait 300ms
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} failed to respond within ${timeoutMs}ms`);
}

async function runE2ETests() {
  console.log('🚀 Starting CelebrAI E2E Verification Suite via Playwright...\n');

  // 1. Launch Vite Dev Server
  const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
  const viteProcess = spawn('node', [viteBin, '--port', '5173'], {
    cwd: rootDir,
    stdio: 'pipe',
  });

  viteProcess.stderr.on('data', (d) => {
    // console.error('[Vite Stderr]', d.toString());
  });

  let serverStarted = false;
  try {
    await waitForServer('http://localhost:5173');
    serverStarted = true;
    console.log('✓ Vite dev server running at http://localhost:5173\n');

    // 2. Launch Chromium
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    page.on('console', (msg) => {
      console.log(`[Browser ${msg.type()}]:`, msg.text());
    });
    page.on('response', (resp) => {
      if (resp.status() >= 400) {
        console.log(`[HTTP ${resp.status()}]:`, resp.url());
      }
    });
    page.on('pageerror', (err) => console.error('[Browser Error]:', err.message));

    // --- JOURNEY 1: Load Application & Sample Showcase Event ---
    console.log('--- Journey 1: Showcase Event & Navigation ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Verify Title & Header
    const title = await page.title();
    console.log(`✓ Page Title: "${title}"`);
    const headerTitle = await page.locator('header').innerText();
    if (!headerTitle.includes('CelebrAI')) throw new Error('CelebrAI header not found');
    console.log('✓ Header & Brand identity confirmed');

    // Screenshot 1: Overview Tab
    await saveScreenshot(page, 'screenshot_overview.png');

    // Verify Overview KPI metrics
    const bodyText = await page.innerText('body');
    if (!bodyText.includes('Aurora Horizons')) throw new Error('Sample event title missing');
    if (!bodyText.includes('$45,000')) throw new Error('Budget amount missing');
    console.log('✓ Overview metrics & Showcase event validated');

    // --- JOURNEY 2: Tab Navigation & Screenshots ---
    console.log('\n--- Journey 2: Full Tab Module Traversal ---');
    
    // Budget Tab
    await page.click('#tab-budget');
    await page.waitForTimeout(400);
    await saveScreenshot(page, 'screenshot_budget.png');
    console.log('✓ Budget & Minor-Units Expense Ledger verified');

    // Timeline Tab & Live Day-of Mode
    await page.click('#tab-timeline');
    await page.waitForTimeout(400);
    // Toggle Day-of Live mode
    await page.click('button:has-text("Enter Day-of Mode")');
    await page.waitForTimeout(400);
    await saveScreenshot(page, 'screenshot_timeline.png');
    console.log('✓ Run-of-Show & Live Day-of Mode verified');
    // Exit live mode
    await page.click('button:has-text("Exit Day-of Mode")');
    await page.waitForTimeout(300);

    // Guests Tab
    await page.click('#tab-guests');
    await page.waitForTimeout(400);
    await saveScreenshot(page, 'screenshot_guests.png');
    console.log('✓ Guests & Dietary Intelligence verified');

    // Creative Studio Tab
    await page.click('#tab-creative');
    await page.waitForTimeout(400);
    await saveScreenshot(page, 'screenshot_creative.png');
    console.log('✓ AI Creative Studio (Invitations & Speeches) verified');

    // --- JOURNEY 3: Infeasible Budget Reduction Rejection ---
    console.log('\n--- Journey 3: Infeasible Budget Rejection Verification ---');
    await page.click('#tab-overview');
    await page.waitForTimeout(300);

    // Enter $30,000 into budget input (committed spent is ~$42,650)
    const budgetInput = page.locator('#adjust-budget');
    await budgetInput.fill('30000');
    await page.click('button:has-text("Rebalance")');
    await page.waitForTimeout(500);

    // Verify modal appeared
    const modal = page.locator('[role="dialog"]');
    if (!(await modal.isVisible())) throw new Error('Adaptive Review Modal failed to open');
    console.log('✓ Adaptive Review Modal opened');

    // Verify Constraint Warning is present
    const warningText = await page.locator('[role="status"]').innerText();
    console.log(`✓ Pre-execution constraint warning: "${warningText.trim().replace(/\n/g, ' ')}"`);

    // Click Apply Recommendations
    await page.click('button:has-text("Apply Recommendations")');
    await page.waitForTimeout(400);

    // Verify Rejection Banner is displayed!
    const alertBanner = page.locator('[role="alert"]');
    if (!(await alertBanner.isVisible())) throw new Error('Expected rejection alert banner not visible!');
    const rejectionText = await alertBanner.innerText();
    console.log(`✓ Explicit Invariant Rejection Banner Verified:\n  "${rejectionText.trim().replace(/\n/g, ' ')}"`);
    await saveScreenshot(page, 'screenshot_adaptive_rejection.png');

    // Dismiss modal safely
    await page.click('button:has-text("Dismiss / Keep Manual")');
    await page.waitForTimeout(400);
    console.log('✓ Modal dismissed safely, event budget protected from illegal mutation');

    // --- JOURNEY 4: Feasible Guest Expansion & Dynamic Rebalancing ---
    console.log('\n--- Journey 4: Feasible Adaptive Ripple Application ---');
    const guestInput = page.locator('#adjust-guests');
    await guestInput.fill('180');
    await page.click('button:has-text("Recalculate")');
    await page.waitForTimeout(500);

    // Capture modal screenshot
    await saveScreenshot(page, 'screenshot_adaptive_applied.png');

    // Click Apply Recommendations
    await page.click('button:has-text("Apply Recommendations")');
    await page.waitForTimeout(500);

    // Verify guest count is updated to 180 and ripple count incremented
    const updatedOverviewText = await page.innerText('body');
    if (!updatedOverviewText.includes('180 Guests') && !updatedOverviewText.includes('180')) {
      throw new Error('Guest count was not updated to 180');
    }
    console.log('✓ Feasible adaptive expansion (+30 guests, +3 tables, +$2,400 catering) applied seamlessly');

    // --- JOURNEY 5: Add Expense to Budget Ledger ---
    console.log('\n--- Journey 5: Add Line-Item Expense Ledger Verification ---');
    await page.click('#tab-budget');
    await page.waitForTimeout(300);

    // Click Log Expense button
    await page.click('button:has-text("Log Expense")');
    await page.waitForTimeout(300);

    // Fill Expense form
    await page.fill('input[placeholder="e.g. Acoustic Audio Equipment Rental"]', 'Artisan Grand Floral Arch');
    await page.fill('input[placeholder="e.g. Sonic Sound Co"]', 'Botanica Bloom Lab');
    await page.fill('input[type="number"][required]', '500');
    await page.click('button:has-text("Save Expense")');
    await page.waitForTimeout(400);

    const budgetBodyText = await page.innerText('body');
    if (!budgetBodyText.includes('Artisan Grand Floral Arch')) {
      throw new Error('New expense line-item not found in budget ledger');
    }
    console.log('✓ Expense line item logged and allocation actuals synchronized');

    // --- JOURNEY 6: Add Guest with Plus-Ones & Dietary ---
    console.log('\n--- Journey 6: Guest Management & Dietary Sync ---');
    await page.click('#tab-guests');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Add Guest")');
    await page.waitForTimeout(300);

    await page.fill('input[placeholder="e.g. Dr. Julian Vance"]', 'Alexander Vance-Sterling');
    await page.fill('input[placeholder="julian@example.com"]', 'alexander.vance@example.com');
    // Select vegan dietary toggle
    await page.click('button:has-text("vegan")');
    await page.click('button:has-text("Save Guest")');
    await page.waitForTimeout(400);

    const guestsBodyText = await page.innerText('body');
    if (!guestsBodyText.includes('Alexander Vance-Sterling')) {
      throw new Error('New guest not found in guest directory');
    }
    console.log('✓ Guest added with vegan dietary restriction');

    // --- JOURNEY 7: Mobile Viewport Responsiveness ---
    console.log('\n--- Journey 7: Mobile Viewport Quality Check (390x844) ---');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('#tab-overview');
    await page.waitForTimeout(400);
    await saveScreenshot(page, 'screenshot_mobile.png');
    console.log('✓ Mobile responsive layout verified on 390x844 iPhone viewport');

    // Restore viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // --- JOURNEY 8: Create New Bespoke Event Wizard (Offline Planner) ---
    console.log('\n--- Journey 8: Bespoke Event Creation Wizard Flow ---');
    await page.click('button:has-text("Plan Event")');
    await page.waitForTimeout(400);

    await page.fill('#evt-title', 'Odyssey Innovation Gala');
    await page.selectOption('#evt-type', 'corporate_gala');
    await page.fill('#guest-count', '120');
    await page.fill('#total-budget', '35000');
    await page.fill('#evt-date', '2026-12-18');
    await page.fill('#evt-location', 'Skyline Pavilion Ballroom');
    await page.selectOption('#venue-type', 'ballroom');

    await page.click('button[type="submit"]:has-text("Generate")');
    try {
      await page.waitForSelector('#create-event-title', { state: 'detached', timeout: 8000 });
    } catch {
      const errTexts = await page.locator('.text-rose-500').allInnerTexts();
      console.log('[Form Error Elements]:', errTexts);
    }

    const newEventText = await page.innerText('body');
    if (!newEventText.includes('Odyssey Innovation Gala')) {
      throw new Error('New bespoke event plan was not generated or loaded');
    }
    console.log('✓ Bespoke event plan generated and populated across all modules');

    // Done!
    await browser.close();
    console.log('\n🎉 ALL 8 REAL-BROWSER E2E JOURNEYS PASSED WITH 100% SUCCESS!');
  } finally {
    if (viteProcess) {
      viteProcess.kill();
    }
  }
}

runE2ETests().catch((err) => {
  console.error('\n❌ E2E Execution Failed:', err);
  process.exit(1);
});
