import { handleChat } from '../server/chat.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon'
  const { status, body } = await handleChat({ messages: req.body?.messages, ip })
  res.status(status).json(body)
}
