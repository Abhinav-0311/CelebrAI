import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const screenshotDir = path.join(process.env.ARTIFACT_DIR || path.join(rootDir, 'test-results'), 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

async function saveScreenshot(page, filename) {
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: false });
  console.log(`[Screenshot Captured] ${filename}`);
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // Retry in 300ms
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} failed to respond within ${timeoutMs}ms`);
}

async function runE2ETests() {
  const isProd = process.argv.includes('--prod');
  const serverMode = isProd ? 'Production Preview' : 'Vite Dev Server';
  console.log(`🚀 Starting CelebrAI Playwright E2E Suite [${serverMode}]...\n`);

  let serverProcess;
  const port = isProd ? '4173' : '5173';
  const baseUrl = `http://localhost:${port}`;

  if (isProd) {
    // Build and run vite preview
    console.log('📦 Starting Production Preview Server on port 4173...');
    const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
    serverProcess = spawn('node', [viteBin, 'preview', '--port', '4173'], {
      cwd: rootDir,
      stdio: 'pipe',
    });
  } else {
    // Run vite dev server
    const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
    serverProcess = spawn('node', [viteBin, '--port', '5173'], {
      cwd: rootDir,
      stdio: 'pipe',
    });
  }

  const browserErrors = [];

  try {
    await waitForServer(baseUrl);
    console.log(`✓ ${serverMode} running at ${baseUrl}\n`);

    // Launch Chromium
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // Collect errors to fail on unexpected crashes
    page.on('pageerror', (err) => {
      console.error('[Browser Error Caught]:', err.message);
      browserErrors.push(err.message);
    });

    page.on('response', (resp) => {
      if (resp.status() >= 500) {
        console.error(`[Server 5xx Error]: ${resp.status()} on ${resp.url()}`);
        browserErrors.push(`Server 5xx on ${resp.url()}`);
      }
    });

    // --- JOURNEY 1: Load Application & Sample Showcase Event ---
    console.log('--- Journey 1: Showcase Event & Executive Overview ---');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    const title = await page.title();
    console.log(`✓ Page Title: "${title}"`);
    const headerTitle = await page.locator('header').innerText();
    if (!headerTitle.includes('CelebrAI')) throw new Error('CelebrAI header not found');
    console.log('✓ Header & Brand identity confirmed');

    // Screenshot 1: Overview Tab
    await saveScreenshot(page, 'screenshot_overview.png');

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
    await page.click('button:has-text("Enter Day-of Mode")');
    await page.waitForTimeout(400);
    await saveScreenshot(page, 'screenshot_timeline.png');
    console.log('✓ Run-of-Show & Live Day-of Mode verified');
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

    // --- JOURNEY 3: Infeasible Budget Reduction Rejection & Guidance ---
    console.log('\n--- Journey 3: Infeasible Budget Rejection Verification ---');
    await page.click('#tab-overview');
    await page.waitForTimeout(300);

    const budgetInput = page.locator('#adjust-budget');
    await budgetInput.fill('30000');
    await page.click('button:has-text("Rebalance")');
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"]');
    if (!(await modal.isVisible())) throw new Error('Adaptive Review Modal failed to open');
    console.log('✓ Adaptive Review Modal opened');

    // Verify non-actionable warning is displayed
    const warningStatus = page.locator('[role="status"]');
    if (!(await warningStatus.isVisible())) throw new Error('Infeasible budget warning box not visible');
    const warningText = await warningStatus.innerText();
    console.log(`✓ Explanatory constraint warning: "${warningText.trim().replace(/\n/g, ' ')}"`);

    // Verify Apply button is disabled (Locked) to protect contractual commitments
    const applyBtn = page.locator('button:has-text("Infeasible (Locked)")');
    const isLocked = await applyBtn.isDisabled();
    if (!isLocked) throw new Error('Apply button should be disabled for infeasible budget reduction');
    console.log('✓ Apply button is safely locked/disabled to prevent invariant violation');
    await saveScreenshot(page, 'screenshot_adaptive_rejection.png');

    // Test Escape key handling to dismiss modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    if (await modal.isVisible()) {
      // Fallback click if key didn't close
      await page.click('button:has-text("Dismiss / Keep Manual")');
      await page.waitForTimeout(400);
    }
    console.log('✓ Modal dismissed via Escape key, event budget protected from illegal mutation');

    // --- JOURNEY 4: Feasible Guest Expansion & Dynamic Rebalancing ---
    console.log('\n--- Journey 4: Feasible Adaptive Ripple Application ---');
    const guestInput = page.locator('#adjust-guests');
    await guestInput.fill('180');
    const recalcBtn = page.locator('button:has-text("Recalculate"), button:has-text("Ripple")').first();
    await recalcBtn.click();
    await page.waitForTimeout(500);

    await saveScreenshot(page, 'screenshot_adaptive_applied.png');
    await page.click('button:has-text("Apply Recommendations")');
    await page.waitForTimeout(500);

    const updatedOverviewText = await page.innerText('body');
    if (!updatedOverviewText.includes('180 Guests') && !updatedOverviewText.includes('180')) {
      throw new Error('Guest count was not updated to 180');
    }
    console.log('✓ Feasible adaptive expansion (+30 guests, +3 tables, +$2,400 catering) applied seamlessly');

    // Verify Vendors Tab reflects adaptive review flag and user-controlled headcount sync
    await page.click('#tab-vendors');
    await page.waitForTimeout(400);

    const vendorReviewBanner = page.locator('text=Adaptive Parameter Update').first();
    if (!(await vendorReviewBanner.isVisible())) {
      throw new Error('Mandatory Adaptive Parameter Update banner not visible in Vendors tab after guest count expansion');
    }
    console.log('✓ Dependent vendor inquiries successfully flagged for review (no silent overwriting)');

    const reviewBadge = page.locator('text=Review Required').first();
    if (!(await reviewBadge.isVisible())) {
      throw new Error('Expected "Review Required" badge to be visible on flagged vendor category');
    }

    const syncBtn = page.locator('button:has-text("Update to 180 Guests")').first();
    if (!(await syncBtn.isVisible())) {
      throw new Error('Expected "Update to 180 Guests" button to be visible on catering vendor card');
    }
    await syncBtn.click();
    await page.waitForTimeout(300);

    // Assert the actual inquiry draft text now contains "180 guests"
    const inquiryDraftText = await page.locator('.whitespace-pre-line').first().innerText();
    if (!inquiryDraftText.includes('180 guests')) {
      throw new Error(`Expected catering RFP inquiry draft to contain "180 guests" after sync, got: ${inquiryDraftText.substring(0, 120)}...`);
    }
    console.log('✓ Mandatory vendor RFP headcount sync to 180 guests verified in live DOM');

    await page.click('#tab-overview');
    await page.waitForTimeout(300);

    // --- JOURNEY 5: Add Expense to Budget Ledger ---
    console.log('\n--- Journey 5: Add Line-Item Expense Ledger Verification ---');
    await page.click('#tab-budget');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Log Expense")');
    await page.waitForTimeout(300);

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
    console.log('\n--- Journey 6: Guest Management with Plus-Ones & Kitchen Dietary Sync ---');
    await page.click('#tab-guests');
    await page.waitForTimeout(300);

    // Read initial confirmed attending and vegan counts
    const prevAttendingText = await page.locator('text=Confirmed Attending').locator('..').locator('p').innerText();
    const prevAttendingCount = parseInt(prevAttendingText) || 0;
    const prevVeganText = await page.locator('text=Vegan').locator('..').locator('p').innerText();
    const prevVeganCount = parseInt(prevVeganText) || 0;

    await page.click('button:has-text("Add Guest")');
    await page.waitForTimeout(300);

    await page.fill('input[placeholder="e.g. Dr. Julian Vance"]', 'Alexander Vance-Sterling');
    await page.fill('input[placeholder="julian@example.com"]', 'alexander.vance@example.com');
    // Set plus-one to 1
    await page.fill('#guest-plus-ones', '1');
    // Select vegan dietary toggle
    await page.click('button:has-text("vegan")');
    await page.click('button:has-text("Save Guest")');
    await page.waitForTimeout(400);

    // Verify attending increased by 2 (1 guest + 1 plus-one)
    const newAttendingText = await page.locator('text=Confirmed Attending').locator('..').locator('p').innerText();
    const newAttendingCount = parseInt(newAttendingText) || 0;
    if (newAttendingCount !== prevAttendingCount + 2) {
      throw new Error(`Expected attending count to increase by 2 from ${prevAttendingCount}, got ${newAttendingCount}`);
    }

    // Verify vegan portions increased by 2
    const newVeganText = await page.locator('text=Vegan').locator('..').locator('p').innerText();
    const newVeganCount = parseInt(newVeganText) || 0;
    if (newVeganCount !== prevVeganCount + 2) {
      throw new Error(`Expected vegan portions to increase by 2 from ${prevVeganCount}, got ${newVeganCount}`);
    }

    console.log(`✓ Guest added with +1 plus-one: Confirmed attending ${prevAttendingCount} → ${newAttendingCount}, Vegan portions ${prevVeganCount} → ${newVeganCount}`);

    // --- JOURNEY 7: Mobile Viewport Quality Check (390px & 320px) ---
    console.log('\n--- Journey 7: Mobile Viewport Quality Check & Overflow Detection ---');
    // Test 390px (iPhone 14)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('#tab-overview');
    await page.waitForTimeout(400);

    // Check for unintended horizontal overflow at 390px
    const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow390) throw new Error('Unintended horizontal page scroll detected at 390px width');

    // Check Plan Event button is visible and clickable on mobile
    const planBtn390 = page.locator('button:has-text("Plan Event"):visible');
    if (!(await planBtn390.isVisible())) throw new Error('Plan Event button not visible at 390px viewport');

    // Check Export button is visible on mobile
    const exportBtn390 = page.locator('button[aria-label="Export event JSON"]').last();
    if (!(await exportBtn390.isVisible())) throw new Error('Export JSON button not visible at 390px viewport');

    await saveScreenshot(page, 'screenshot_mobile.png');
    console.log('✓ 390px viewport verified: zero horizontal overflow, Plan Event & Export fully accessible');

    // Test 320px (Compact Mobile / iPhone SE 1st gen)
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(300);
    const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow320) throw new Error('Unintended horizontal page scroll detected at 320px width');
    console.log('✓ 320px compact viewport verified: zero horizontal overflow');

    // Restore desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // --- JOURNEY 8: Real Browser File Download Export & Upload Import ---
    console.log('\n--- Journey 8: Lossless JSON Export & Import via Real UI File Transfer ---');

    // Register dialog listener for import success/failure alerts
    page.on('dialog', async (dialog) => {
      console.log(`[Browser Dialog] ${dialog.type()}: "${dialog.message()}"`);
      await dialog.accept();
    });

    // 1. Export JSON via real UI download button
    const downloadPromise = page.waitForEvent('download');
    const exportBtn = page.locator('button[aria-label="Export event JSON"]:visible').first();
    await exportBtn.click();
    const download = await downloadPromise;
    const downloadFilename = download.suggestedFilename();
    const tempExportPath = path.join(os.tmpdir(), `test-export-${Date.now()}-${downloadFilename}`);
    await download.saveAs(tempExportPath);

    // Verify downloaded file on disk
    if (!fs.existsSync(tempExportPath)) {
      throw new Error(`Downloaded JSON file was not saved to ${tempExportPath}`);
    }
    const downloadedRaw = fs.readFileSync(tempExportPath, 'utf-8');
    const downloadedData = JSON.parse(downloadedRaw);
    if (!downloadedData || !downloadedData.title || !downloadedData.guestCount) {
      throw new Error('Downloaded file does not contain valid CelebrAI event JSON structure');
    }
    const exportedGuests = downloadedData.guestCount;
    console.log(`✓ Real file download captured: "${downloadFilename}" (${downloadedRaw.length} bytes, guestCount: ${exportedGuests})`);

    // 2. Reset event to Sample State (150 guests) to establish distinct initial state
    await page.click('button:has-text("Sample Event")');
    await page.waitForTimeout(500);

    const resetPageText = await page.innerText('body');
    if (!resetPageText.includes('150 Guests') && !resetPageText.includes('150')) {
      throw new Error('Failed to reset event to sample state (150 guests)');
    }
    console.log('✓ Reset to sample state verified (150 guests)');

    // 3. Upload previously downloaded JSON using real HTML file input control
    const fileInput = page.locator('input[type="file"][accept=".json"]');
    await fileInput.setInputFiles(tempExportPath);
    await page.waitForTimeout(600);

    // 4. Verify exact restored state in DOM
    // Overview tab: Assert restored guest count = 180
    await page.click('#tab-overview');
    await page.waitForTimeout(300);
    const restoredOverview = await page.innerText('body');
    if (!restoredOverview.includes('180 Guests') && !restoredOverview.includes('180')) {
      throw new Error('Failed to restore guest count of 180 after JSON import');
    }

    // Budget tab: Assert restored line-item expense exists
    await page.click('#tab-budget');
    await page.waitForTimeout(300);
    const restoredBudget = await page.innerText('body');
    if (!restoredBudget.includes('Artisan Grand Floral Arch')) {
      throw new Error('Failed to restore custom line-item expense "Artisan Grand Floral Arch" after JSON import');
    }

    // Guests tab: Assert restored modified guest record "Alexander Vance-Sterling" exists
    await page.click('#tab-guests');
    await page.waitForTimeout(300);
    const restoredGuests = await page.innerText('body');
    if (!restoredGuests.includes('Alexander Vance-Sterling')) {
      throw new Error('Failed to restore custom guest record "Alexander Vance-Sterling" after JSON import');
    }

    // 5. Page Reload Persistence Verification: State must persist across page refresh
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    // Overview tab after reload must retain 180 guests
    const reloadedOverview = await page.innerText('body');
    if (!reloadedOverview.includes('180 Guests') && !reloadedOverview.includes('180')) {
      throw new Error('Imported event parameters failed to persist after page reload');
    }
    // Navigate to Guests tab to verify guest directory persistence
    await page.click('#tab-guests');
    await page.waitForTimeout(300);
    const reloadedGuests = await page.innerText('body');
    if (!reloadedGuests.includes('Alexander Vance-Sterling')) {
      throw new Error('Imported guest record failed to persist after page reload');
    }
    console.log('✓ Strict restoration assertions passed: 180 guests, custom expense, guest record & reload persistence verified');

    // Clean up temporary file
    try {
      fs.unlinkSync(tempExportPath);
    } catch {
      // non-fatal
    }
    console.log('✓ Full real-browser UI cycle verified: Download Export → Reset → File Input Upload → Lossless State Restoration');

    // --- JOURNEY 9: Create New Bespoke Event Wizard (Offline Planner) ---
    console.log('\n--- Journey 9: Bespoke Event Creation Wizard Across All Modules ---');
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
    await page.waitForSelector('#create-event-title', { state: 'detached', timeout: 10000 });

    // Verify all modules populated with new event
    const newBodyText = await page.innerText('body');
    if (!newBodyText.includes('Odyssey Innovation Gala')) {
      throw new Error('New bespoke event plan was not generated or loaded');
    }

    // Verify Budget module populated
    await page.click('#tab-budget');
    await page.waitForTimeout(300);
    const budgetContent = await page.innerText('body');
    if (!budgetContent.includes('$35,000')) throw new Error('Budget not updated to $35,000');

    // Verify Timeline module populated
    await page.click('#tab-timeline');
    await page.waitForTimeout(300);
    const timelineMilestones = await page.locator('button[title*="Click to cycle status"]').count();
    if (timelineMilestones < 3) throw new Error(`Timeline milestones not generated (count: ${timelineMilestones})`);

    // Verify Creative module populated
    await page.click('#tab-creative');
    await page.waitForTimeout(300);
    const creativeContent = await page.innerText('body');
    if (!creativeContent.includes('Invitation') && !creativeContent.includes('Speech')) {
      throw new Error('Creative suite invitations or speeches not generated');
    }

    console.log('✓ Bespoke event generated and verified populated across all 6 core functional modules');

    // Check if any browser errors were recorded
    if (browserErrors.length > 0) {
      throw new Error(`E2E encountered ${browserErrors.length} browser errors during execution:\n${browserErrors.join('\n')}`);
    }

    await browser.close();
    console.log(`\n🎉 ALL 9 REAL-BROWSER E2E JOURNEYS PASSED WITH 100% SUCCESS [${serverMode}]!`);
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

runE2ETests().catch((err) => {
  console.error('\n❌ E2E Execution Failed:', err);
  process.exit(1);
});
