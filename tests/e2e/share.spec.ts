import { test, expect, type APIRequestContext } from '@playwright/test'

/**
 * The "Share this note" bar at the end of every blog post.
 */

async function firstBlogPostPath(request: APIRequestContext): Promise<string> {
  const html = await (await request.get('/blog')).text()
  const href = html.match(/href="(\/blog\/[^"?#]+)"/)?.[1]
  expect(href, 'blog index links to at least one post').toBeTruthy()
  return href!
}

test('Share on X opens X compose with the post filled in, in a new tab', async ({ page, request }) => {
  const path = await firstBlogPostPath(request)
  await page.goto(path)
  const title = (await page.locator('h1').first().textContent())!.trim()
  const share = page.getByRole('region', { name: 'Share this note' }).getByRole('link', { name: 'Share on X' })
  await expect(share).toHaveAttribute('target', '_blank')
  const href = new URL((await share.getAttribute('href'))!)
  expect(href.origin + href.pathname).toBe('https://x.com/intent/post')
  expect(href.searchParams.get('text')).toBe(title)
  // The canonical URL, not whatever host the test server runs on.
  expect(href.searchParams.get('url')).toBe(`https://n8builds.dev${path}`)
})

test('Copy link copies the canonical URL and says so', async ({ page, request, browserName, context }) => {
  const path = await firstBlogPostPath(request)
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(path)
  const bar = page.getByRole('region', { name: 'Share this note' })
  await bar.getByRole('button', { name: 'Copy link' }).click()
  await expect(bar.getByRole('button', { name: 'Link copied' })).toBeVisible()
  if (browserName === 'chromium') {
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`https://n8builds.dev${path}`)
  }
  // It resets, so a second copy confirms again.
  await expect(bar.getByRole('button', { name: 'Copy link' })).toBeVisible({ timeout: 5000 })
})

test("Copy link says so when the browser won't copy, instead of claiming it did", async ({ page, request }) => {
  const path = await firstBlogPostPath(request)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
      configurable: true,
    })
    document.execCommand = () => false
    // Every label the button shows: its message lasts 2.5 seconds, which a busy
    // CI browser can miss between polls (WebKit on #24).
    const seen: string[] = ((window as unknown as { __labels: string[] }).__labels = [])
    new MutationObserver(() => {
      const label = document.querySelector('[aria-label="Share this note"] button')?.textContent?.trim()
      if (label && seen.at(-1) !== label) seen.push(label)
    }).observe(document, { subtree: true, childList: true, characterData: true })
  })
  await page.goto(path)
  const bar = page.getByRole('region', { name: 'Share this note' })
  await bar.getByRole('button', { name: 'Copy link' }).click()
  const labels = () => page.evaluate(() => (window as unknown as { __labels: string[] }).__labels)
  await expect.poll(labels).toContain("Couldn't copy")
  expect(await labels()).not.toContain('Link copied')
  // It resets, so another try is possible.
  await expect(bar.getByRole('button', { name: 'Copy link' })).toBeVisible({ timeout: 5000 })
})
