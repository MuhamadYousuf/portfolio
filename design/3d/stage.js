// Shared helpers for the 3D product renders (Three.js, rendered headlessly by scripts/render-work.mjs).
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export { THREE }

export function stage(canvas, { width, height, exposure = 1, env = 0.4, tone = THREE.AgXToneMapping }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(width, height, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = tone
  renderer.toneMappingExposure = exposure
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = env
  return { renderer, scene }
}

export const loadTex = (url, { srgb = true, aniso = 8 } = {}) =>
  new Promise((res, rej) =>
    new THREE.TextureLoader().load(url, (t) => {
      if (srgb) t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = aniso
      res(t)
    }, undefined, rej))

// Seeded random so renders are repeatable.
export function rng(seed = 7) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
}

// Tileable value-noise canvas: base for paper, plaster, linen and crinkle maps.
export function noiseCanvas(size, { scale = 8, octaves = 4, seed = 3 } = {}) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(size, size)
  const r = rng(seed)
  const grids = []
  for (let o = 0; o < octaves; o++) {
    const n = scale * 2 ** o
    grids.push({ n, v: Array.from({ length: n * n }, r) })
  }
  const smooth = (t) => t * t * (3 - 2 * t)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let val = 0, amp = 1, tot = 0
      for (const { n, v } of grids) {
        const fx = (x / size) * n, fy = (y / size) * n
        const x0 = Math.floor(fx), y0 = Math.floor(fy)
        const tx = smooth(fx - x0), ty = smooth(fy - y0)
        const g = (i, j) => v[((j % n) + n) % n * n + (((i % n) + n) % n)]
        const a = g(x0, y0) + (g(x0 + 1, y0) - g(x0, y0)) * tx
        const b = g(x0, y0 + 1) + (g(x0 + 1, y0 + 1) - g(x0, y0 + 1)) * tx
        val += (a + (b - a) * ty) * amp
        tot += amp
        amp *= 0.5
      }
      const k = (val / tot) * 255
      const i = (y * size + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = k
      img.data[i + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
  return c
}

// Height canvas -> tangent-space normal map texture.
export function normalFromHeight(src, strength = 2) {
  const s = src.width
  const h = src.getContext('2d').getImageData(0, 0, s, s).data
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')
  const out = ctx.createImageData(s, s)
  const at = (x, y) => h[(((y + s) % s) * s + ((x + s) % s)) * 4] / 255
  for (let y = 0; y < s; y++)
    for (let x = 0; x < s; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const l = Math.hypot(dx, dy, 1)
      const i = (y * s + x) * 4
      out.data[i] = ((-dx / l) * 0.5 + 0.5) * 255
      out.data[i + 1] = ((dy / l) * 0.5 + 0.5) * 255
      out.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255
      out.data[i + 3] = 255
    }
  ctx.putImageData(out, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

export function canvasTex(c, { srgb = false, repeat = 1 } = {}) {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  return t
}

// A seamless studio sweep: floor that curves up into a back wall.
export function sweep({ width = 4, depth = 2, height = 2, radius = 0.35, color = '#e8dccb', roughness = 0.9, normalMap, normalScale = 0.2 }) {
  const segs = 160
  const geo = new THREE.PlaneGeometry(width, 1, 1, segs)
  const pos = geo.attributes.position
  const floorLen = depth, arcLen = (Math.PI / 2) * radius, wallLen = height
  const total = floorLen + arcLen + wallLen
  for (let i = 0; i < pos.count; i++) {
    const s = (pos.getY(i) + 0.5) * total
    let y, z
    if (s < floorLen) { y = 0; z = floorLen - s }
    else if (s < floorLen + arcLen) { const a = (s - floorLen) / radius; y = radius - Math.cos(a) * radius; z = -Math.sin(a) * radius }
    else { y = radius + (s - floorLen - arcLen); z = -radius }
    pos.setY(i, y); pos.setZ(i, z)
  }
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({ color, roughness, normalMap, normalScale: new THREE.Vector2(normalScale, normalScale) })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true
  return mesh
}

// Projected light pattern (gobo) for a SpotLight: window blinds or leaves.
export function goboCanvas(kind, size = 1024, seed = 5) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000'
  if (kind === 'blinds') {
    ctx.filter = 'blur(10px)'
    ctx.save(); ctx.translate(size / 2, size / 2); ctx.rotate(-0.38); ctx.translate(-size, -size)
    for (let y = 0; y < size * 2; y += 92) ctx.fillRect(0, y, size * 2, 46)
    ctx.restore()
  } else if (kind === 'leaves') {
    const r = rng(seed)
    ctx.filter = 'blur(6px)'
    for (let i = 0; i < 14; i++) {
      ctx.save()
      ctx.translate(r() * size, r() * size * 0.7)
      ctx.rotate(r() * Math.PI * 2)
      const L = size * (0.28 + r() * 0.2)
      ctx.beginPath(); ctx.moveTo(0, 0)
      for (let k = 0; k < 14; k++) {
        const t = k / 13, w = Math.sin(t * Math.PI) * L * 0.09
        ctx.rect(t * L - 6, -w * 1.8, L / 15, w * 3.6)
      }
      ctx.fill()
      ctx.fillRect(0, -3, L, 6)
      ctx.restore()
    }
  }
  ctx.filter = 'none'
  // Fade the edges so the spot cone has no hard border.
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.5)
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function done(renderer, scene, camera, frames = 3) {
  for (let i = 0; i < frames; i++) renderer.render(scene, camera)
  window.__done = true
}
