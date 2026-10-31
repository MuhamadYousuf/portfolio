// Product props for the Kōen renders: stand-up pouch, cup of coffee, roasted beans.
import { THREE, rng, noiseCanvas, normalFromHeight, canvasTex } from './stage.js'

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

// ---------- Stand-up pouch ----------
let crinkle
export function pouch(tex, backColor, { w = 0.158, h = 0.24, d = 0.058 } = {}) {
  crinkle ||= normalFromHeight(noiseCanvas(512, { scale: 10, octaves: 5, seed: 4 }), 3.5)
  const g = new THREE.Group()
  const body = (sign) => {
    const geo = new THREE.PlaneGeometry(w, h, 90, 140)
    const p = geo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i)
      const u = x / w + 0.5, v = y / h + 0.5
      const fx = Math.pow(Math.max(0, Math.sin(Math.PI * u)), 0.5)
      const fy = (1 - smooth(0.8, 0.9, v)) * (0.78 + 0.22 * smooth(0, 0.1, v))
      const b = fx * fy
      // filled pouches pull the side seams inwards and wrinkle along the edges
      const crease = 0.0016 * Math.sin(v * 41 + u * 9) * Math.sin(u * 13) * (1 - fx) * fy
      p.setXYZ(i, x * (1 - 0.06 * fy), y, sign * ((d / 2) * b + crease + 0.0006))
    }
    geo.computeVertexNormals()
    if (sign < 0) geo.index.array.reverse()
    return geo
  }
  const mat = (map, color) => new THREE.MeshPhysicalMaterial({ map, color, roughness: 0.66, normalMap: crinkle, normalScale: new THREE.Vector2(0.14, 0.14) })
  const front = new THREE.Mesh(body(1), mat(tex))
  const back = new THREE.Mesh(body(-1), mat(null, backColor))
  // oval base gusset
  const shape = new THREE.Shape()
  for (let k = 0; k <= 40; k++) { const u = k / 40; shape[k ? 'lineTo' : 'moveTo']((u - 0.5) * w * 0.94, (d / 2) * 0.78 * Math.pow(Math.max(0, Math.sin(Math.PI * u)), 0.5)) }
  for (let k = 40; k >= 0; k--) { const u = k / 40; shape.lineTo((u - 0.5) * w * 0.94, -(d / 2) * 0.78 * Math.pow(Math.max(0, Math.sin(Math.PI * u)), 0.5)) }
  const base = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: backColor, roughness: 0.7 }))
  base.rotation.x = Math.PI / 2
  base.position.y = -h / 2 + 0.0005
  for (const m of [front, back, base]) { m.castShadow = true; m.receiveShadow = true; g.add(m) }
  g.position.y = h / 2
  return g
}

// ---------- Cup of coffee ----------
export function cup() {
  const g = new THREE.Group()
  const ceramic = new THREE.MeshPhysicalMaterial({ color: '#f3eee6', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 })
  const prof = [[0.001, 0], [0.025, 0], [0.027, 0.002], [0.033, 0.016], [0.0395, 0.042], [0.0405, 0.048], [0.0398, 0.0492], [0.0384, 0.048], [0.0318, 0.018], [0.024, 0.006], [0.001, 0.006]].map(([x, y]) => new THREE.Vector2(x, y))
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), ceramic)
  body.position.y = 0.006
  const sauc = [[0.001, 0], [0.05, 0], [0.068, 0.004], [0.074, 0.009], [0.0725, 0.0095], [0.064, 0.0055], [0.03, 0.0045], [0.001, 0.0045]].map(([x, y]) => new THREE.Vector2(x, y))
  const saucer = new THREE.Mesh(new THREE.LatheGeometry(sauc, 96), ceramic)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.0115, 0.0033, 16, 40, Math.PI * 1.2), ceramic)
  handle.position.set(0.041, 0.031, 0); handle.rotation.z = -Math.PI * 0.6
  // crema with a simple latte-art heart
  const c = document.createElement('canvas'); c.width = c.height = 512
  const x = c.getContext('2d')
  const gr = x.createRadialGradient(256, 256, 20, 256, 256, 256)
  gr.addColorStop(0, '#9a5a2e'); gr.addColorStop(0.75, '#7a4220'); gr.addColorStop(1, '#4a2410')
  x.fillStyle = gr; x.fillRect(0, 0, 512, 512)
  x.fillStyle = '#f1e2c8'; x.filter = 'blur(3px)'
  x.beginPath(); x.moveTo(256, 380); x.bezierCurveTo(120, 280, 150, 150, 240, 190); x.bezierCurveTo(256, 196, 256, 196, 272, 190); x.bezierCurveTo(362, 150, 392, 280, 256, 380); x.fill()
  x.fillStyle = '#7a4220'; x.fillRect(252, 250, 8, 140)
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.0384, 64), new THREE.MeshPhysicalMaterial({ map: canvasTex(c, { srgb: true }), roughness: 0.25, clearcoat: 0.6 }))
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.0505
  for (const m of [body, saucer, handle, coffee]) { m.castShadow = true; m.receiveShadow = true; g.add(m) }
  return g
}

// ---------- Roasted beans ----------
export function beans(n, area, seed) {
  const r = rng(seed)
  const c = document.createElement('canvas'); c.width = 256; c.height = 128
  const x = c.getContext('2d')
  const gr = x.createLinearGradient(0, 0, 256, 0)
  gr.addColorStop(0, '#2b160b'); gr.addColorStop(0.5, '#5a3218'); gr.addColorStop(1, '#2b160b')
  x.fillStyle = gr; x.fillRect(0, 0, 256, 128)
  x.strokeStyle = '#140904'; x.lineWidth = 7; x.filter = 'blur(1.5px)'
  x.beginPath(); x.moveTo(64, 0); x.bezierCurveTo(52, 40, 76, 88, 64, 128); x.stroke()
  const geo = new THREE.SphereGeometry(1, 28, 18)
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshPhysicalMaterial({ map: canvasTex(c, { srgb: true }), roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35 }), n)
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler()
  for (let i = 0; i < n; i++) {
    const s = 0.85 + r() * 0.3
    const px = area.x0 + r() * (area.x1 - area.x0), pz = area.z0 + r() * (area.z1 - area.z0)
    e.set(Math.PI / 2 + (r() - 0.5) * 0.6, r() * Math.PI * 2, (r() - 0.5) * 0.5)
    q.setFromEuler(e)
    m.compose(new THREE.Vector3(px, 0.0028 * s, pz), q, new THREE.Vector3(0.0041 * s, 0.006 * s, 0.003 * s))
    mesh.setMatrixAt(i, m)
  }
  mesh.castShadow = true; mesh.receiveShadow = true
  return mesh
}
