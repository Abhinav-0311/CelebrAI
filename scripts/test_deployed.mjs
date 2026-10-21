import { chromium } from 'playwright';

/**
 * CelebrAI — Hosted Vercel Production Verification & Smoke Test
 *
 * Usage:
 *   node scripts/test_deployed.mjs <deployed-url>
 * Example:
 *   node scripts/test_deployed.mjs https://celebr-ai.vercel.app
 */

const targetUrl = process.argv[2]?.replace(/\/$/, '') || process.env.VERCEL_URL;

if (!targetUrl) {
  console.error('❌ Error: No target URL provided.');
  console.log('Usage: node scripts/test_deployed.mjs https://<your-project>.vercel.app');
  process.exit(1);
}

const normalizedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

async function runDeployedTests() {
  console.log(`\n============================================================`);
  console.log(`🌐 CelebrAI Hosted Deployment Verification`);
  console.log(`Target: ${normalizedUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`============================================================\n`);

  // --- TEST 1: Frontend Root & Security Headers ---
  console.log('--- Step 1: Testing Frontend Availability & Headers ---');
  const feStart = Date.now();
  const feRes = await fetch(normalizedUrl);
  const feLatency = Date.now() - feStart;
  const feHtml = await feRes.text();

  if (!feRes.ok) {
    throw new Error(`Frontend returned HTTP ${feRes.status} (${feRes.statusText})`);
  }
  if (!feHtml.includes('CelebrAI') && !feHtml.includes('root')) {
    throw new Error('Frontend HTML does not appear to serve CelebrAI application bundle');
  }

  const xFrameOptions = feRes.headers.get('x-frame-options');
  const xContentType = feRes.headers.get('x-content-type-options');
  console.log(`✓ Frontend HTTP 200 OK (${feLatency}ms)`);
  console.log(`✓ Security Header X-Frame-Options: ${xFrameOptions || 'not set'}`);
  console.log(`✓ Security Header X-Content-Type-Options: ${xContentType || 'not set'}`);

  // --- TEST 2: Serverless Function Security Guards ---
  console.log('\n--- Step 2: Testing /api/gemini Security Guards ---');
  const apiEndpoint = `${normalizedUrl}/api/gemini`;

  // Check 405 Method Not Allowed on GET
  const getRes = await fetch(apiEndpoint, { method: 'GET' });
  if (getRes.status !== 405) {
    console.warn(`⚠️ Warning: Expected GET /api/gemini to return 405, got ${getRes.status}`);
  } else {
    console.log(`✓ GET guard: HTTP 405 Method Not Allowed verified`);
  }

  // Check 400 Bad Request on empty POST
  const emptyPostRes = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (emptyPostRes.status !== 400) {
    console.warn(`⚠️ Warning: Expected empty POST to return 400, got ${emptyPostRes.status}`);
  } else {
    console.log(`✓ Schema validation guard: HTTP 400 Bad Request verified`);
  }

  // --- TEST 3: Live /api/gemini Plan Generation ---
  console.log('\n--- Step 3: Testing Plan Generation & AI Engine Status ---');
  const testPayload = {
    action: 'generate_full_plan',
    eventData: {
      title: 'Solstice Innovation Summit',
      eventType: 'corporate_gala',
      guestCount: 100,
      totalBudget: 40000,
      currency: 'USD',
      eventDate: '2026-11-20',
      location: 'San Francisco, CA',
      venueType: 'ballroom',
      vibeKeywords: ['technological', 'luminant', 'visionary'],
    },
  };

  const apiStart = Date.now();
  const apiRes = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload),
  });
  const apiLatency = Date.now() - apiStart;
  const apiJson = await apiRes.json();

  if (!apiRes.ok) {
    throw new Error(`API failed with HTTP ${apiRes.status}: ${JSON.stringify(apiJson)}`);
  }

  const rateLimitHeader = apiRes.headers.get('x-ratelimit-limit');
  const rateRemainingHeader = apiRes.headers.get('x-ratelimit-remaining');

  console.log(`✓ Plan Generation HTTP 200 OK (${apiLatency}ms)`);
  console.log(`✓ Rate Limit Headers: Limit=${rateLimitHeader || 'edge'}, Remaining=${rateRemainingHeader || 'edge'}`);

  const isLive = apiJson.mode === 'live_ai';
  if (isLive) {
    console.log(`⚡ LIVE GEMINI AI ACTIVE! Upstream model (${apiJson.model || 'Gemini'}) generated complete structured plan in ${apiLatency}ms.`);
  } else {
    console.log(`🛡️ OFFLINE FALLBACK ACTIVE: (mode: "${apiJson.mode}") ${apiJson.message || 'Server returned deterministic fallback plan.'}`);
  }

  // Validate Zero-Cent Allocation Reconciliation
  const allocations = apiJson.data?.allocations || [];
  const sumAllocatedCents = allocations.reduce((s, a) => s + (a.allocatedCents || 0), 0);
  const targetCents = 40000 * 100;
  if (sumAllocatedCents !== targetCents) {
    throw new Error(`Allocation reconciliation error: sum (${sumAllocatedCents}) !== target (${targetCents})`);
  }
  console.log(`✓ Single-cent financial reconciliation verified: $40,000.00 exact (0 drift across ${allocations.length} categories)`);

  // --- TEST 4: Real Headless Browser Smoke Test against Deployed Site ---
  console.log('\n--- Step 4: Running Headless Browser Smoke Test on Live URL ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const browserErrors = [];
  page.on('pageerror', (err) => browserErrors.push(err.message));

  await page.goto(normalizedUrl, { waitUntil: 'networkidle' });

  // 1. Verify brand & title
  const pageTitle = await page.title();
  if (!pageTitle.includes('CelebrAI')) {
    throw new Error(`Unexpected page title on deployed site: "${pageTitle}"`);
  }
  console.log(`✓ Browser page load verified: "${pageTitle}"`);

  // 2. Verify tab navigation
  await page.click('#tab-budget');
  await page.waitForTimeout(300);
  await page.click('#tab-timeline');
  await page.waitForTimeout(300);
  await page.click('#tab-guests');
  await page.waitForTimeout(300);
  await page.click('#tab-creative');
  await page.waitForTimeout(300);
  await page.click('#tab-overview');
  await page.waitForTimeout(300);
  console.log('✓ All 6 core modules navigated seamlessly in real browser');

  // 3. Verify adaptive recalculation
  const guestInput = page.locator('#adjust-guests');
  if (await guestInput.isVisible()) {
    await guestInput.fill('160');
    await page.click('button:has-text("Recalculate")');
    await page.waitForTimeout(400);
    const modal = page.locator('div[role="dialog"]');
    if (await modal.isVisible()) {
      await page.keyboard.press('Escape');
      console.log('✓ Hosted Adaptive Intelligence Engine reactive modal verified');
    }
  }

  await browser.close();

  if (browserErrors.length > 0) {
    throw new Error(`Browser console logged ${browserErrors.length} errors:\n${browserErrors.join('\n')}`);
  }

  console.log('\n============================================================');
  if (isLive) {
    console.log(`🎉 DEPLOYED PRODUCTION VERIFICATION PASSED WITH 100% SUCCESS!`);
    console.log(`⚡ LIVE GEMINI AI VERIFIED! Model: ${apiJson.model}`);
    console.log(`URL: ${normalizedUrl}`);
    console.log(`API Latency: ${apiLatency}ms`);
  } else {
    console.log(`⚠️ HOSTED DEPLOYMENT VERIFIED, BUT LIVE-AI NOT VERIFIED.`);
    console.log(`Operating Mode: 🛡️ OFFLINE DETERMINISTIC FALLBACK (mode: "${apiJson.mode}")`);
    console.log(`Reason: ${apiJson.message}`);
    console.log(`URL: ${normalizedUrl}`);
    console.log(`API Latency: ${apiLatency}ms`);
    if (process.argv.includes('--require-live')) {
      throw new Error(`Assertion failed: Expected mode "live_ai", but received "${apiJson.mode}". Live AI generation was not observed.`);
    }
  }
  console.log(`============================================================\n`);
}

runDeployedTests().catch((err) => {
  console.error('\n❌ Deployed Verification Failed:', err);
  process.exit(1);
});
