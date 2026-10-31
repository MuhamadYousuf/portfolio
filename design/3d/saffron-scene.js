// Saffron & Salt table: overhead flat-lay on dark walnut with menu, plate, cards, brass bowl, glass and spices.
import { THREE, loadTex, rng, noiseCanvas, normalFromHeight, canvasTex } from './stage.js'

function walnut() {
  const s = 1024
  const c = document.createElement('canvas'); c.width = c.height = s
  const x = c.getContext('2d')
  const r = rng(31)
  x.fillStyle = '#4a2a1a'; x.fillRect(0, 0, s, s)
  // long grain lines with gentle waves
  for (let i = 0; i < 420; i++) {
    const y0 = r() * s, amp = 4 + r() * 18, freq = 0.002 + r() * 0.006, ph = r() * 6
    x.strokeStyle = r() > 0.5 ? `rgba(26,12,6,${0.15 + r() * 0.35})` : `rgba(120,72,40,${0.08 + r() * 0.2})`
    x.lineWidth = 0.6 + r() * 2.4
    x.beginPath()
    for (let px = 0; px <= s; px += 8) x.lineTo(px, y0 + Math.sin(px * freq + ph) * amp)
    x.stroke()
  }
  const plank = 256
  x.fillStyle = 'rgba(10,4,2,.65)'
  for (let y = plank; y < s; y += plank) x.fillRect(0, y - 1, s, 3)
  return c
}

function threads(n, radius, seed) {
  const r = rng(seed)
  const geo = new THREE.CylinderGeometry(0.00028, 0.00018, 0.011, 5)
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#8e140d', roughness: 0.55, emissive: '#2a0201', emissiveIntensity: 0.25 }), n)
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler()
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * radius
    e.set(Math.PI / 2 + (r() - 0.5) * 0.5, 0, r() * Math.PI * 2)
    q.setFromEuler(e)
    m.compose(new THREE.Vector3(Math.cos(a) * d, 0.001 + r() * 0.004, Math.sin(a) * d), q, new THREE.Vector3(1, 0.5 + r() * 0.7, 1))
    mesh.setMatrixAt(i, m)
  }
  mesh.castShadow = true
  return mesh
}

function pods(n, area, seed) {
  const r = rng(seed)
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ color: '#6b7a36', roughness: 0.75, normalMap: normalFromHeight(noiseCanvas(128, { scale: 4, octaves: 3, seed: 2 }), 6), normalScale: new THREE.Vector2(0.8, 0.8) }), n)
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler()
  for (let i = 0; i < n; i++) {
    e.set(0, r() * Math.PI * 2, Math.PI / 2)
    q.setFromEuler(e)
    m.compose(new THREE.Vector3(area.x0 + r() * (area.x1 - area.x0), 0.004, area.z0 + r() * (area.z1 - area.z0)), q, new THREE.Vector3(0.0042 + r() * 0.0008, 0.0085 + r() * 0.0015, 0.0038))
    mesh.setMatrixAt(i, m)
  }
  mesh.castShadow = mesh.receiveShadow = true
  return mesh
}

// Saffron pulao: a dome of individual grains, part saffron-stained, with fried shallots and mint.
function pulao(seed) {
  const r = rng(seed)
  const g = new THREE.Group()
  const N = 4200
  const grains = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 6), new THREE.MeshPhysicalMaterial({ roughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.4 }), N)
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color()
  const palette = ['#f4ecd6', '#f1e6cc', '#efe3c4', '#e9a227', '#e08d1e', '#f2c45a']
  for (let i = 0; i < N; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.068
    const h = 0.034 * Math.pow(Math.max(0, 1 - (d / 0.068) ** 2), 0.8)
    e.set(r() * Math.PI, r() * Math.PI, r() * Math.PI)
    q.setFromEuler(e)
    m.compose(new THREE.Vector3(Math.cos(a) * d, 0.012 + h * (0.75 + r() * 0.25), Math.sin(a) * d), q, new THREE.Vector3(0.0011, 0.0011, 0.0046))
    grains.setMatrixAt(i, m)
    grains.setColorAt(i, col.set(palette[r() < 0.62 ? Math.floor(r() * 3) : 3 + Math.floor(r() * 3)]))
  }
  grains.castShadow = grains.receiveShadow = true
  const onions = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: '#7a3a12', roughness: 0.6 }), 70)
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.035
    e.set(r() * 3, r() * 3, r() * 3); q.setFromEuler(e)
    m.compose(new THREE.Vector3(Math.cos(a) * d, 0.012 + 0.034 * (1 - (d / 0.068) ** 2) + 0.002, Math.sin(a) * d), q, new THREE.Vector3(0.0045, 0.0007, 0.0016))
    onions.setMatrixAt(i, m)
  }
  onions.castShadow = true
  const mint = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: '#3f6b2a', roughness: 0.5 }), 7)
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2, d = 0.01 + r() * 0.025
    e.set(0, r() * 6, 0.25); q.setFromEuler(e)
    m.compose(new THREE.Vector3(Math.cos(a) * d, 0.012 + 0.034 * (1 - (d / 0.068) ** 2) + 0.003, Math.sin(a) * d), q, new THREE.Vector3(0.007, 0.0008, 0.0042))
    mint.setMatrixAt(i, m)
  }
  mint.castShadow = true
  g.add(grains, onions, mint)
  return g
}

function sheet(map, w, h, t, backColor) {
  const mats = [backColor, backColor, map, backColor, backColor, backColor].map((v) =>
    v instanceof THREE.Texture ? new THREE.MeshStandardMaterial({ map: v, roughness: 0.85 }) : new THREE.MeshStandardMaterial({ color: v, roughness: 0.85 }))
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, t, h), mats)
  m.castShadow = m.receiveShadow = true
  return m
}

export async function buildSaffron(scene) {
  const wood = canvasTex(walnut(), { srgb: true })
  wood.repeat.set(1.2, 1.2)
  const table = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.55, normalMap: normalFromHeight(walnut(), 1.2), normalScale: new THREE.Vector2(0.4, 0.4) }))
  table.rotation.x = -Math.PI / 2
  table.receiveShadow = true
  scene.add(table)

  const [menuT, frontT, backT, plateT] = await Promise.all(['saffron-menu', 'saffron-card-front', 'saffron-card-back', 'saffron-plate'].map((n) => loadTex(`../tex/out/${n}.png`)))

  // menu
  const menu = sheet(menuT, 0.2, 0.308, 0.0016, '#f6ecd9')
  menu.position.set(-0.075, 0.0008, 0.0); menu.rotation.y = 0.07
  scene.add(menu)

  // linen napkin under the plate
  const weave = document.createElement('canvas'); weave.width = weave.height = 256
  const wx = weave.getContext('2d'); wx.fillStyle = '#808080'; wx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 256; i += 3) { wx.fillStyle = 'rgba(255,255,255,.35)'; wx.fillRect(i, 0, 1, 256); wx.fillStyle = 'rgba(0,0,0,.25)'; wx.fillRect(0, i, 256, 1) }
  const linen = normalFromHeight(weave, 2); linen.repeat.set(6, 6)
  const napkin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.004, 0.2), new THREE.MeshStandardMaterial({ color: '#d8c3aa', roughness: 0.95, normalMap: linen, normalScale: new THREE.Vector2(0.6, 0.6) }))
  napkin.position.set(0.12, 0.002, 0.15); napkin.rotation.y = 0.45
  napkin.castShadow = napkin.receiveShadow = true
  scene.add(napkin)

  // patterned plate
  const ceramic = new THREE.MeshPhysicalMaterial({ color: '#f4eadb', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 })
  const prof = [[0.0001, 0], [0.07, 0], [0.074, 0.006], [0.08, 0.008], [0.118, 0.014], [0.122, 0.0165], [0.119, 0.0172], [0.08, 0.0105], [0.0001, 0.0105]].map(([x, y]) => new THREE.Vector2(x, y))
  const plate = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), ceramic)
  const decal = new THREE.Mesh(new THREE.CircleGeometry(0.121, 128), new THREE.MeshPhysicalMaterial({ map: plateT, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, polygonOffset: true, polygonOffsetFactor: -2 }))
  decal.rotation.x = -Math.PI / 2; decal.position.y = 0.0108
  // lift the rim of the decal to follow the plate's slope
  const dp = decal.geometry.attributes.position
  for (let i = 0; i < dp.count; i++) { const d = Math.hypot(dp.getX(i), dp.getY(i)); dp.setZ(i, d > 0.08 ? (d - 0.08) * 0.16 : 0) }
  decal.geometry.computeVertexNormals()
  const pg = new THREE.Group(); pg.add(plate, decal, pulao(17))
  for (const m of [plate, decal]) { m.castShadow = m.receiveShadow = true }
  pg.position.set(0.115, 0.004, 0.14)
  scene.add(pg)

  // business cards: back face-up underneath, front on top
  const cb = sheet(backT, 0.085, 0.049, 0.0007, '#5a2213'); cb.position.set(-0.04, 0.0019, 0.215); cb.rotation.y = -0.35
  const cf = sheet(frontT, 0.085, 0.049, 0.0007, '#f6ecd9'); cf.position.set(-0.018, 0.0026, 0.23); cf.rotation.y = -0.12
  scene.add(cb, cf)

  // brass bowl of saffron
  const brass = new THREE.MeshPhysicalMaterial({ color: '#c99a4e', metalness: 1, roughness: 0.3, clearcoat: 0.3 })
  const bowlProf = [[0.0001, 0], [0.028, 0], [0.04, 0.008], [0.048, 0.022], [0.05, 0.03], [0.047, 0.03], [0.045, 0.022], [0.037, 0.01], [0.0001, 0.006]].map(([x, y]) => new THREE.Vector2(x, y))
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlProf, 96), brass)
  bowl.castShadow = bowl.receiveShadow = true
  const t = threads(110, 0.026, 5); t.position.y = 0.006
  const bg = new THREE.Group(); bg.add(bowl, t)
  bg.position.set(0.125, 0, -0.165)
  scene.add(bg)

  scene.add(pods(9, { x0: 0.03, x1: 0.2, z0: -0.1, z1: -0.06 }, 4), pods(5, { x0: -0.21, x1: -0.16, z0: 0.14, z1: 0.24 }, 8), pods(4, { x0: -0.2, x1: -0.1, z0: -0.25, z1: -0.2 }, 12))
  const loose = threads(7, 0.02, 9); loose.position.set(0.075, 0.0005, -0.12)
  scene.add(loose)

  // soft window light from the upper left
  const sun = new THREE.DirectionalLight('#ffe2bd', 2.3)
  sun.position.set(-0.6, 1.0, -0.45)
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  Object.assign(sun.shadow.camera, { left: -0.45, right: 0.45, top: 0.45, bottom: -0.45, near: 0.2, far: 3 })
  sun.shadow.bias = -0.0002
  sun.shadow.radius = 6
  sun.shadow.blurSamples = 20
  scene.add(sun, new THREE.HemisphereLight('#fff1de', '#2e180e', 0.32))
}
