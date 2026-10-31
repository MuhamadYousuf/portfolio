import { defineConfig, loadEnv } from 'vite'

// In dev, serve /api/chat from the same handler Vercel runs in production,
// so the chatbot works with `npm run dev` and a local .env file.
function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end()
        }
        let raw = ''
        for await (const chunk of req) raw += chunk
        const { handleChat } = await import('./server/chat.js')
        let messages
        try {
          messages = JSON.parse(raw || '{}').messages
        } catch {}
        const { status, body } = await handleChat({ messages, ip: req.socket.remoteAddress })
        res.statusCode = status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(body))
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Expose GEMINI_* from .env to the dev server (never to the browser bundle).
  Object.assign(process.env, loadEnv(mode, process.cwd(), 'GEMINI_'))
  return { plugins: [devApi()] }
})
