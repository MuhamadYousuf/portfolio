import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { projects } from './projects.js'
import { initScene } from './scene.js'

gsap.registerPlugin(ScrollTrigger)
document.body.classList.add('is-loading')

const img = (slug) => `/work/${slug}.svg`
const pad = (n) => String(n + 1).padStart(2, '0')

// ---------- Work grid ----------
const grid = document.getElementById('work-grid')
grid.innerHTML = projects
  .map(
    (p, i) => `
  <article class="card" data-index="${i}" data-cursor="View">
    <div class="card__inner">
      <div class="card__media">
        <img src="${img(p.slug)}" alt="${p.title} — ${p.category}" loading="lazy" />
        <div class="card__shine"></div>
      </div>
      <span class="card__tag">${p.category}</span>
    </div>
    <div class="card__info">
      <h3 class="card__title"><span class="card__num">${pad(i)}</span>${p.title}</h3>
      <span class="card__meta">${p.year}</span>
    </div>
  </article>`
  )
  .join('')

grid.querySelectorAll('.card').forEach((card) => {
  const inner = card.querySelector('.card__inner')
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    inner.style.transform = `rotateY(${(x - 0.5) * 14}deg) rotateX(${(0.5 - y) * 14}deg)`
    inner.style.setProperty('--mx', `${x * 100}%`)
    inner.style.setProperty('--my', `${y * 100}%`)
  })
  card.addEventListener('mouseleave', () => (inner.style.transform = ''))
  card.addEventListener('click', () => openModal(+card.dataset.index))
})

// ---------- Modal ----------
const modal = document.getElementById('modal')
function openModal(i) {
  const p = projects[i]
  document.getElementById('modal-img').src = img(p.slug)
  document.getElementById('modal-img').alt = p.title
  document.getElementById('modal-cat').textContent = `${pad(i)} — ${p.category}`
  document.getElementById('modal-title').textContent = p.title
  document.getElementById('modal-summary').textContent = p.summary
  document.getElementById('modal-year').textContent = p.year
  document.getElementById('modal-deliverables').innerHTML = p.deliverables.map((d) => `<li>${d}</li>`).join('')
  modal.classList.add('is-open')
  modal.setAttribute('aria-hidden', 'false')
  lenis.stop()
}
function closeModal() {
  modal.classList.remove('is-open')
  modal.setAttribute('aria-hidden', 'true')
  lenis.start()
}
modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal))
window.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal())

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
  tl.to('#loader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' })
    .from('.hero__title .word', { yPercent: 110, rotate: 4, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, '-=0.5')
    .from('.hero__meta, .hero__bottom, .nav', { opacity: 0, y: 20, duration: 0.8, stagger: 0.1 }, '-=0.9')
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
gsap.from('.service', { x: -60, opacity: 0, duration: 1, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.services__list', start: 'top 80%' } })
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
