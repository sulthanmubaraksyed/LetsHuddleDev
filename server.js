import { createServer } from 'http'
import { readFileSync, existsSync, statSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = parseInt(process.env.PORT || '8080', 10)
const DIST = join(__dirname, 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.txt':  'text/plain',
}

function serve(req, res) {
  const url = req.url.split('?')[0]
  let filePath = join(DIST, url === '/' ? 'index.html' : url)

  // SPA fallback — serve index.html for any path that isn't a real file
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DIST, 'index.html')
  }

  const ext = extname(filePath).toLowerCase()
  const contentType = MIME[ext] || 'application/octet-stream'

  try {
    const content = readFileSync(filePath)
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    })
    res.end(content)
  } catch {
    res.writeHead(500)
    res.end('Server error')
  }
}

createServer(serve).listen(PORT, '0.0.0.0', () => {
  console.log(`LetsHuddle running on port ${PORT}`)
})
