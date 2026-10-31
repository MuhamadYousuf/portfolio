import { projects } from './projects.js'

const EMAIL = 'muhammadyousuf77998bp@gmail.com'
const GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}&su=${encodeURIComponent('Project enquiry')}`
const GREETING = 'Assalam o alaikum! 👋 I’m Yusi, Yousuf’s slightly-too-enthusiastic AI assistant. Ask me about his work, services or how to hire him — English ya Roman Urdu, dono chalega.'

const escape = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// Light markdown (bold, italics, line breaks) plus action tags the model is told to use.
function render(text) {
  const actions = []
  const body = text
    .replace(/\[\[open:([a-z]+)\]\]/g, (_, slug) => {
      const i = projects.findIndex((p) => p.slug === slug)
      if (i >= 0) actions.push(`<button type="button" class="chat__action" data-open="${i}">View ${escape(projects[i].title)} →</button>`)
      return ''
    })
    .replace(/\[\[email\]\]/g, () => {
      actions.push(`<a class="chat__action chat__action--mail" href="${GMAIL_URL}" target="_blank" rel="noopener">Email Yousuf ↗</a>`)
      return ''
    })
    .trim()
  const html = escape(body)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
    .replace(/\n/g, '<br>')
  return html + (actions.length ? `<div class="chat__actions">${[...new Set(actions)].join('')}</div>` : '')
}

export function initChat({ openProject, onOpen, onClose }) {
  const fab = document.getElementById('chat-fab')
  const panel = document.getElementById('chat')
  const log = document.getElementById('chat-log')
  const form = document.getElementById('chat-form')
  const input = document.getElementById('chat-input')
  const chips = document.getElementById('chat-chips')
  const history = []
  let busy = false

  function add(role, text) {
    const el = document.createElement('div')
    el.className = `chat__msg chat__msg--${role}`
    el.innerHTML = role === 'model' ? render(text) : escape(text)
    log.appendChild(el)
    log.scrollTop = log.scrollHeight
    return el
  }

  function toggle(open) {
    panel.classList.toggle('is-open', open)
    fab.classList.toggle('is-hidden', open)
    panel.setAttribute('aria-hidden', String(!open))
    fab.setAttribute('aria-expanded', String(open))
    if (open) {
      if (!log.children.length) add('model', GREETING)
      setTimeout(() => input.focus({ preventScroll: true }), 300)
      onOpen?.()
    } else onClose?.()
  }

  async function send(text) {
    text = text.trim()
    if (!text || busy) return
    busy = true
    chips.hidden = true
    input.value = ''
    add('user', text)
    history.push({ role: 'user', text })
    const typing = add('model', '')
    typing.classList.add('is-typing')
    typing.innerHTML = '<i></i><i></i><i></i>'
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      const data = await res.json().catch(() => ({}))
      const reply = data.reply || 'Network ne dhoka de diya 😅 Dobara try karo ya email kar do. [[email]]'
      typing.classList.remove('is-typing')
      typing.innerHTML = render(reply)
      if (res.ok) history.push({ role: 'model', text: reply })
      else history.pop()
    } catch {
      typing.classList.remove('is-typing')
      typing.innerHTML = render('Lagta hai internet chai break pe hai ☕ Thori der baad try karo. [[email]]')
      history.pop()
    }
    log.scrollTop = log.scrollHeight
    busy = false
  }

  fab.addEventListener('click', () => toggle(true))
  document.getElementById('chat-close').addEventListener('click', () => toggle(false))
  window.addEventListener('keydown', (e) => e.key === 'Escape' && panel.classList.contains('is-open') && toggle(false))
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    send(input.value)
  })
  chips.addEventListener('click', (e) => e.target.matches('button') && send(e.target.textContent.replace(/[👋]/gu, '')))
  log.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open]')
    if (!btn) return
    if (window.innerWidth < 760) toggle(false)
    openProject(+btn.dataset.open)
  })
}
