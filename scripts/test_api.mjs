import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = 'http://127.0.0.1:5192';
const server = spawn(process.execPath, [
  path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
  '--host', '127.0.0.1', '--port', '5192', '--strictPort',
], {
  cwd: root,
  env: { ...process.env, GEMINI_API_KEY: '', GEMINI_MODEL: '' },
  stdio: 'pipe',
});
let serverLog = '';
server.stderr.on('data', data => { serverLog = (serverLog + data).slice(-10000); });
const request = (pathname, options = {}) => fetch(baseUrl + pathname, {
  ...options, signal: AbortSignal.timeout(20000),
});

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(server.exitCode, null, `API test server exited: ${serverLog}`);
    try {
      if ((await request('/')).ok) { ready = true; break; }
    } catch { /* Wait for the dedicated local server. */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert(ready, 'API test server did not start');
  assert.equal((await request('/api/gemini')).status, 405);

  const eventTypes = ['wedding', 'birthday', 'anniversary', 'corporate_gala', 'baby_shower', 'graduation', 'festival', 'themed_party'];
  for (const eventType of eventTypes) {
    const response = await request('/api/gemini', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate_full_plan',
        eventData: {
          title: 'Runtime contract check', eventType, guestCount: 123, totalBudget: 33333.33,
          eventDate: '2026-12-18', location: 'City Gardens', venueType: 'garden',
        },
      }),
    });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    assert.equal(body.success, true);
    assert.equal(body.mode, 'offline_fallback');
    assert.equal(body.data.allocations.reduce((sum, allocation) => sum + allocation.allocatedCents, 0), 3333333);
    assert(body.data.allocations.every(allocation => allocation.actualSpentCents === 0));
    assert(body.data.milestones.length >= 3);
    assert(body.data.creative.invitations.length > 0);
  }
  const invalid = await request('/api/gemini', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
  });
  assert.equal(invalid.status, 400);
  const oversized = await request('/api/gemini', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: '界'.repeat(9000) }),
  });
  assert.equal(oversized.status, 413);
  assert.equal((await request('/api/gemini', { method: 'OPTIONS' })).status, 200);
  console.log('API HTTP checks passed: eight event types, exact cents, method/schema/UTF-8 guards and OPTIONS.');
} catch (error) {
  console.error(serverLog);
  throw error;
} finally {
  server.kill();
}
