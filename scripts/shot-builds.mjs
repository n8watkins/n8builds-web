import { chromium } from '@playwright/test'

const shots = [
  { url: 'http://localhost:1337/builds/piper-tts', out: '/tmp/shot-piper.png', full: true },
  { url: 'http://localhost:1337/builds/appturnity', out: '/tmp/shot-appturnity.png', full: true },
  { url: 'http://localhost:1337/builds/repo-steward', out: '/tmp/shot-steward.png', full: true },
  { url: 'http://localhost:1337/#builds', out: '/tmp/shot-marquee.png', full: false },
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
for (const { url, out, full } of shots) {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.evaluate(() => {
    document.querySelectorAll('[class*="z-\\[9999\\]"], nextjs-portal').forEach(el => el.remove())
  })
  await page.screenshot({ path: out, fullPage: full })
  console.log('wrote', out)
}
await browser.close()
