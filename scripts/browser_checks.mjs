import assert from 'node:assert/strict';

export const workspaceTabs = ['overview', 'budget', 'timeline', 'guests', 'creative', 'vendors', 'intelligence'];

export async function openTab(page, tab) {
  const control = page.locator(`#tab-${tab}`);
  await control.click();
  const panelId = await control.getAttribute('aria-controls');
  assert.equal(panelId, `panel-${tab}`);
  await page.locator(`#${panelId}`).waitFor({ state: 'visible' });
  assert.equal(await control.getAttribute('aria-selected'), 'true');
  await page.locator(`#${panelId}`).getByRole('heading').first().waitFor({ state: 'visible' });
}

export async function verifyNavigation(page) {
  assert.equal(await page.getByRole('tab').count(), workspaceTabs.length);
  for (const tab of workspaceTabs) await openTab(page, tab);
  await openTab(page, 'overview');
}

export async function verifyAdaptiveReview(page) {
  await openTab(page, 'overview');
  const input = page.getByLabel('Guest Count', { exact: true });
  await input.waitFor({ state: 'visible' });
  const currentCount = Number(await input.inputValue());
  await input.fill(String(currentCount + 10));
  await page.getByRole('button', { name: 'Recalculate guest adaptive ripple', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  await dialog.getByRole('button', { name: 'Apply Recommendations', exact: true }).waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await openTab(page, 'budget');
  await openTab(page, 'overview');
  assert.equal(await input.inputValue(), String(currentCount));
}
