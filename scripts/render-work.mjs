// Renders project artwork with the system Chrome/Edge (no browser download).
//   1. design/tex/*.html  `.tex[data-tex]`   -> design/tex/out/<name>.png   (labels used as 3D textures)
//   2. design/*.html      `.board[data-out]` -> public/work/<name>.webp     (2D boards)
//   3. design/3d/*.html   `.board[data-out]` -> public/work/<name>.webp     (WebGL scenes; wait for window.__done)
// Usage: npm run render:work [-- name-filter]
import { readdirSync, readFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import puppeteer from 'puppeteer-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
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

// ES modules and WebGL textures need http://, not file://
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json' }
const server = createServer((req, res) => {
  const path = normalize(join(root, decodeURIComponent(req.url.split('?')[0])))
  if (!path.startsWith(root) || !existsSync(path)) return res.writeHead(404).end()
  res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }).end(readFileSync(path))
})
await new Promise((r) => server.listen(0, r))
const base = `http://localhost:${server.address().port}`

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  protocolTimeout: 600_000,
  args: ['--force-color-profile=srgb', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage()
page.on('pageerror', (e) => console.error('page error:', e.message))
page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()))

const list = (dir) => (existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter((f) => f.endsWith('.html') && f.includes(filter)) : [])

async function shoot(dir, file, selector, attr, outFor, type, wait) {
  await page.goto(`${base}/${dir}/${file}`, { waitUntil: 'networkidle0', timeout: 120_000 })
  await page.evaluate(() => document.fonts.ready)
  if (wait) await page.waitForFunction('window.__done === true', { timeout: 600_000, polling: 500 })
  for (const el of await page.$$(selector)) {
    const name = await el.evaluate((n, a) => n.dataset[a], attr)
    const path = outFor(name)
    mkdirSync(dirname(path), { recursive: true })
    await el.screenshot({ path, type, ...(type === 'webp' ? { quality: 88 } : {}) })
    console.log('rendered', name)
  }
}

await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1 })
for (const f of list('design/tex')) await shoot('design/tex', f, '.tex[data-tex]', 'tex', (n) => join(root, 'design/tex/out', `${n}.png`), 'png')

await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1.5 })
for (const f of list('design')) await shoot('design', f, '.board[data-out]', 'out', (n) => join(root, 'public/work', `${n}.webp`), 'webp')
for (const f of list('design/3d')) await shoot('design/3d', f, '.board[data-out]', 'out', (n) => join(root, 'public/work', `${n}.webp`), 'webp', true)

await browser.close()
server.close()
