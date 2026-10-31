import './style.css'
import './sections.css'
import './chat.css'
import './dev.css'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { projects } from './projects.js'
import { initScene } from './scene.js'
import { initChat } from './chat.js'

gsap.registerPlugin(ScrollTrigger)
document.body.classList.add('is-loading')

const EMAIL = 'muhammadyousuf77998bp@gmail.com'
const GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}&su=${encodeURIComponent('Project enquiry')}`
const GROUPS = {
  nocturne: 'identity',
  helio: 'identity',
  atlas: 'identity',
  saffron: 'identity',
  koen: 'print',
  fieldwork: 'print',
  grit: 'type',
  echo: 'type',
}

const img = (slug) => `/work/${slug}.svg`
const pad = (n) => String(n + 1).padStart(2, '0')
const isTouch = window.matchMedia('(hover: none)').matches

// ---------- Fit display type ----------
// Scale headlines so their widest line fills the column exactly — no overflow on any screen.
function fitType() {
  document.querySelectorAll('[data-fit]').forEach((el) => {
    const max = +el.dataset.fit
    el.style.fontSize = '100px'
    const lines = [...el.querySelectorAll('.line')]
    lines.forEach((l) => (l.style.width = 'max-content'))
    const widest = Math.max(...lines.map((l) => l.getBoundingClientRect().width))
    lines.forEach((l) => (l.style.width = ''))
    const size = Math.min(max, (el.clientWidth / widest) * 100 * 0.99)
    el.style.fontSize = `${size}px`
  })
  ScrollTrigger.refresh()
}
document.fonts.ready.then(fitType)
window.addEventListener('resize', fitType)

// ---------- Contact ----------
document.getElementById('mail-link').href = GMAIL_URL
const toast = document.getElementById('toast')
function showToast(msg) {
  toast.textContent = msg
  toast.classList.add('is-on')
  clearTimeout(showToast.t)
  showToast.t = setTimeout(() => toast.classList.remove('is-on'), 2200)
}
document.getElementById('copy-mail').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(EMAIL)
    showToast('Email copied ✶')
  } catch {
    showToast(EMAIL)
  }
})

// ---------- Work grid ----------
const grid = document.getElementById('work-grid')
grid.innerHTML = projects
  .map(
    (p, i) => `
  <article class="card" data-index="${i}" data-group="${GROUPS[p.slug]}" data-cursor="View" tabindex="0" role="button" aria-label="Open ${p.title}">
    <div class="card__inner">
      <div class="card__media">
        <img src="${img(p.slug)}" alt="${p.title} — ${p.category}" loading="lazy" />
        <div class="card__shine"></div>
      </div>
      <span class="card__tag">${p.category}</span>
      <span class="card__swatches">${p.palette.map((c) => `<i style="background:${c}"></i>`).join('')}</span>
    </div>
    <div class="card__info">
      <h3 class="card__title"><span class="card__num">${pad(i)}</span>${p.title}</h3>
      <span class="card__meta">${p.role} · ${p.year}</span>
    </div>
  </article>`
  )
  .join('')

grid.querySelectorAll('.card').forEach((card) => {
  const inner = card.querySelector('.card__inner')
  if (!isTouch) {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      inner.style.transform = `rotateY(${(x - 0.5) * 14}deg) rotateX(${(0.5 - y) * 14}deg)`
      inner.style.setProperty('--mx', `${x * 100}%`)
      inner.style.setProperty('--my', `${y * 100}%`)
    })
    card.addEventListener('mouseleave', () => (inner.style.transform = ''))
  }
  card.addEventListener('click', () => openModal(+card.dataset.index))
  card.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openModal(+card.dataset.index)))
})

// ---------- Filters ----------
const filterBtns = document.querySelectorAll('#filters button')
filterBtns.forEach((btn) =>
  btn.addEventListener('click', () => {
    const f = btn.dataset.filter
    filterBtns.forEach((b) => b.classList.toggle('is-active', b === btn))
    const cards = [...grid.querySelectorAll('.card')]
    gsap.to(cards, {
      opacity: 0,
      y: 30,
      duration: 0.25,
      onComplete: () => {
        grid.classList.toggle('is-filtered', f !== 'all')
        cards.forEach((c) => (c.hidden = f !== 'all' && c.dataset.group !== f))
        gsap.fromTo(cards.filter((c) => !c.hidden), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'expo.out' })
        ScrollTrigger.refresh()
      },
    })
  })
)

// ---------- Modal ----------
const modal = document.getElementById('modal')
const panel = modal.querySelector('.modal__panel')
const $ = (id) => document.getElementById(id)
let current = 0

function fillModal(i) {
  const p = projects[i]
  current = i
  $('modal-img').src = img(p.slug)
  $('modal-img').alt = `${p.title} — ${p.category}`
  $('modal-cat').textContent = `${pad(i)} / ${pad(projects.length - 1)} — ${p.category}`
  $('modal-title').textContent = p.title
  $('modal-summary').textContent = p.summary
  $('modal-challenge').textContent = p.challenge
  $('modal-approach').textContent = p.approach
  $('modal-meta').innerHTML = [
    ['Client', p.client],
    ['Role', p.role],
    ['Timeline', p.duration],
  ]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
    .join('')
  $('modal-palette').innerHTML = p.palette
    .map((c) => `<button type="button" class="chip" style="--c:${c}" data-hex="${c}"><i></i><span>${c.toUpperCase()}</span></button>`)
    .join('')
  $('modal-type').innerHTML = p.type.map((t) => `<li>${t}</li>`).join('')
  $('modal-deliverables').innerHTML = p.deliverables.map((d) => `<li>${d}</li>`).join('')
  $('modal-year').textContent = p.year
  panel.scrollTop = 0
}

function openModal(i) {
  fillModal(i)
  modal.classList.add('is-open')
  modal.setAttribute('aria-hidden', 'false')
  lenis.stop()
}
function closeModal() {
  modal.classList.remove('is-open')
  modal.setAttribute('aria-hidden', 'true')
  lenis.start()
}
function step(dir) {
  const next = (current + dir + projects.length) % projects.length
  gsap.to(panel, { opacity: 0, x: -30 * dir, duration: 0.2, onComplete: () => {
    fillModal(next)
    gsap.fromTo(panel, { opacity: 0, x: 30 * dir }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out', clearProps: 'transform,opacity' })
  } })
}
modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal))
$('modal-prev').addEventListener('click', () => step(-1))
$('modal-next').addEventListener('click', () => step(1))
$('modal-palette').addEventListener('click', async (e) => {
  const chip = e.target.closest('.chip')
  if (!chip) return
  try {
    await navigator.clipboard.writeText(chip.dataset.hex)
    showToast(`${chip.dataset.hex.toUpperCase()} copied`)
  } catch {}
})
window.addEventListener('keydown', (e) => {
  if (!modal.classList.contains('is-open')) return
  if (e.key === 'Escape') closeModal()
  if (e.key === 'ArrowRight') step(1)
  if (e.key === 'ArrowLeft') step(-1)
})

const chat = initChat({ openProject: openModal })
document.getElementById('dev-chat').addEventListener('click', () => chat.open())

// ---------- Cursor ----------
const cursor = document.getElementById('cursor')
const cursorLabel = document.getElementById('cursor-label')
const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' })
const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' })
let sceneLabel = ''
window.addEventListener('pointermove', (e) => {
  cx(e.clientX)
  cy(e.clientY)
  const target = e.target.closest?.('[data-cursor]')
  const label = target ? target.dataset.cursor : sceneLabel
  cursor.classList.toggle('is-big', !!label)
  cursorLabel.textContent = label
})

// ---------- Smooth scroll ----------
const lenis = new Lenis({ lerp: 0.09 })
lenis.stop()
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
document.querySelectorAll('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')
    if (id.length < 2) return
    e.preventDefault()
    lenis.scrollTo(id === '#top' ? 0 : id, { offset: 0, duration: 1.6 })
  })
)

// ---------- 3D scene ----------
const manager = new THREE.LoadingManager()
const loaderNum = document.getElementById('loader-num')
const progress = { v: 0 }
manager.onProgress = (_, loaded, total) => {
  gsap.to(progress, {
    v: (loaded / total) * 100,
    duration: 0.6,
    onUpdate: () => (loaderNum.textContent = Math.round(progress.v)),
  })
}
manager.onLoad = () => gsap.delayedCall(0.8, intro)

const scene = initScene({
  canvas: document.getElementById('webgl'),
  images: projects.map((p) => img(p.slug)),
  manager,
  mobile: window.innerWidth < 760,
  onHover: (i) => {
    sceneLabel = i >= 0 ? 'View' : ''
    cursor.classList.toggle('is-big', !!sceneLabel)
    cursorLabel.textContent = sceneLabel
  },
  onSelect: openModal,
})

lenis.on('scroll', ({ scroll, velocity }) => {
  scene.setScroll(scroll / window.innerHeight, velocity)
})

// ---------- Intro ----------
let introPlayed = false
function intro() {
  if (introPlayed) return
  introPlayed = true
  loaderNum.textContent = '100'
  const tl = gsap.timeline({
    onComplete: () => {
      document.body.classList.remove('is-loading')
      lenis.start()
    },
  })
  tl.to('.loader__swatches i', { scaleY: 0, duration: 0.5, stagger: 0.05, ease: 'power3.in' })
    .to('#loader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.2')
    .from('.hero__title .word', { yPercent: 110, rotate: 4, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, '-=0.5')
    .from('.hero__meta, .hero__bottom > *, .nav', { opacity: 0, y: 20, duration: 0.8, stagger: 0.08 }, '-=0.9')
}
// Never leave visitors stuck on the loader if a texture stalls.
setTimeout(intro, 6000)

// ---------- Scroll reveals ----------
gsap.utils.toArray('.reveal').forEach((el) => {
  gsap.from(el, { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
})
gsap.utils.toArray('.card').forEach((el) => {
  gsap.from(el, { y: 140, opacity: 0, rotate: 3, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } })
})
gsap.utils.toArray('.principle').forEach((el) => {
  gsap.from(el.querySelector('.principle__art'), { scale: 0.4, rotate: -45, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
})
gsap.from('.service', { x: -60, opacity: 0, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.services__list', start: 'top 80%' } })
gsap.from('.dev__card', { y: 100, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.dev__grid', start: 'top 85%' } })
gsap.from('.dev__live', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.dev__live', start: 'top 90%' } })
gsap.from('.craft__card', { y: 100, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.craft__grid', start: 'top 85%' } })
gsap.from('.tool__bar i', { scaleX: 0, duration: 1.6, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.tools', start: 'top 85%' } })
gsap.from('.timeline__row', { y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.timeline', start: 'top 85%' } })
gsap.from('.step', { y: 100, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.process__steps', start: 'top 85%' } })
gsap.from('.contact__title .word', { yPercent: 110, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.contact', start: 'top 60%' } })

document.querySelectorAll('[data-count]').forEach((el) => {
  const obj = { n: 0 }
  gsap.to(obj, {
    n: +el.dataset.count,
    duration: 2,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 90%' },
    onUpdate: () => (el.textContent = Math.round(obj.n)),
  })
})

// Marquee speeds up with scroll velocity.
const marquees = document.querySelectorAll('.marquee__track, .clients__track')
lenis.on('scroll', ({ velocity }) => {
  const rate = 1 + Math.min(Math.abs(velocity) * 0.15, 4)
  marquees.forEach((m) => m.getAnimations().forEach((a) => (a.playbackRate = rate)))
})

// ---------- Local clock ----------
const clockEl = document.getElementById('clock')
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' })
const updateClock = () => (clockEl.textContent = `Karachi — ${fmt.format(new Date())} PKT`)
updateClock()
setInterval(updateClock, 30000)
