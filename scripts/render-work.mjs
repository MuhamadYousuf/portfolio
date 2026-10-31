// Renders every `.board[data-out]` in design/*.html to public/work/<data-out>.webp
// using the system Chrome/Edge (no browser download). Usage: npm run render:work [-- file-filter]
import { readdirSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const designDir = join(root, 'design')
const outDir = join(root, 'public', 'work')
const filter = process.argv[2] || ''

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean)
const executablePath = candidates.find((p) => existsSync(p))
if (!executablePath) throw new Error('No Chrome/Edge found — set CHROME_PATH')

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--force-color-profile=srgb'] })
const page = await browser.newPage()
await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1.5 })

for (const file of readdirSync(designDir).filter((f) => f.endsWith('.html') && f.includes(filter))) {
  await page.goto(pathToFileURL(join(designDir, file)).href, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  for (const el of await page.$$('.board[data-out]')) {
    const name = await el.evaluate((n) => n.dataset.out)
    const path = join(outDir, `${name}.webp`)
    mkdirSync(dirname(path), { recursive: true })
    await el.screenshot({ path, type: 'webp', quality: 86 })
    console.log('rendered', name)
  }
}
await browser.close()
