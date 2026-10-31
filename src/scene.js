import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const PANEL_W = 1.6
const PANEL_H = 2.0

// Bend a plane around a cylinder of radius r so the posters sit flush on the ring.
function curvedPlane(r) {
  const geo = new THREE.PlaneGeometry(PANEL_W, PANEL_H, 24, 1)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const theta = x / r
    pos.setX(i, Math.sin(theta) * r)
    pos.setZ(i, Math.cos(theta) * r - r)
  }
  geo.computeVertexNormals()
  return geo
}

export function initScene({ canvas, images, manager, mobile, onHover, onSelect }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2))
  renderer.setClearColor(0x0c0c0c, 1)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x0c0c0c, 10, 22)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.set(0, 0, 13)

  // ---------- Iridescent blob ----------
  const blobGeo = new THREE.SphereGeometry(1.25, mobile ? 72 : 160, mobile ? 72 : 160)
  const basePositions = blobGeo.attributes.position.array.slice()
  const blob = new THREE.Mesh(
    blobGeo,
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.75,
      roughness: 0.14,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      iridescence: 1,
      iridescenceIOR: 1.6,
      iridescenceThicknessRange: [180, 900],
      envMapIntensity: 2.2,
    })
  )
  scene.add(blob)

  const key = new THREE.PointLight(0xff4d1f, 160, 20)
  key.position.set(3, 2, 4)
  const rim = new THREE.PointLight(0x3d5afe, 180, 20)
  rim.position.set(-4, -2, 2)
  const fill = new THREE.PointLight(0xd4ff3a, 60, 20)
  fill.position.set(0, 4, -3)
  scene.add(key, rim, fill, new THREE.AmbientLight(0xffffff, 0.3))

  // ---------- Poster ring ----------
  const ring = new THREE.Group()
  ring.rotation.set(0.16, 0, -0.07)
  scene.add(ring)

  const loader = new THREE.TextureLoader(manager)
  const panels = []
  let radius = 4.6
  const backMat = new THREE.MeshBasicMaterial({ color: 0x181818, side: THREE.BackSide })

  images.forEach((src, i) => {
    const tex = loader.load(src)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
    const geo = curvedPlane(radius)
    const front = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide, transparent: true }))
    const back = new THREE.Mesh(geo, backMat)
    const holder = new THREE.Group()
    holder.add(front, back)
    const angle = (i / images.length) * Math.PI * 2
    holder.userData = { angle, index: i, hover: 0 }
    front.userData.index = i
    ring.add(holder)
    panels.push({ holder, front })
  })

  function layoutRing() {
    panels.forEach(({ holder }) => {
      const a = holder.userData.angle
      holder.position.set(Math.sin(a) * radius, 0, Math.cos(a) * radius)
      holder.rotation.y = a
    })
  }
  layoutRing()

  // ---------- Dust ----------
  const COUNT = 700
  const dustPos = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    const r = 3 + Math.random() * 9
    const t = Math.random() * Math.PI * 2
    const p = Math.acos(2 * Math.random() - 1)
    dustPos[i * 3] = r * Math.sin(p) * Math.cos(t)
    dustPos[i * 3 + 1] = r * Math.cos(p) * 0.6
    dustPos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t)
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0xf1efe9, size: 0.025, transparent: true, opacity: 0.6, depthWrite: false })
  )
  scene.add(dust)

  // ---------- Interaction ----------
  const pointer = new THREE.Vector2(9, 9)
  const mouse = { x: 0, y: 0 }
  const raycaster = new THREE.Raycaster()
  let hovered = -1
  let dragging = false
  let dragMoved = 0
  let lastX = 0
  let spin = 0
  let spinVel = 0
  let scroll = 0
  let scrollVel = 0

  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    if (e.target === canvas) pointer.set(mouse.x, mouse.y)
    else pointer.set(9, 9)
    if (dragging) {
      const dx = e.clientX - lastX
      lastX = e.clientX
      dragMoved += Math.abs(dx)
      spinVel += dx * 0.0009
    }
  })
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true
    dragMoved = 0
    lastX = e.clientX
  })
  window.addEventListener('pointerup', () => {
    if (dragging && dragMoved < 6 && hovered >= 0) onSelect(hovered)
    dragging = false
  })

  // ---------- Resize ----------
  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const narrow = w < 760
    camera.position.z = narrow ? 15.5 : 13
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', resize)
  resize()

  // ---------- Loop ----------
  const clock = new THREE.Clock()
  const posAttr = blobGeo.attributes.position
  let frame = 0

  function tick() {
    const t = clock.getElapsedTime()
    frame++

    // Blob: layered sine displacement, normals refreshed every other frame.
    const arr = posAttr.array
    const pulse = 0.12 + Math.min(Math.abs(scrollVel) * 0.004, 0.25)
    for (let i = 0; i < arr.length; i += 3) {
      const x = basePositions[i]
      const y = basePositions[i + 1]
      const z = basePositions[i + 2]
      const n =
        Math.sin(x * 2.1 + t * 1.3) * Math.cos(y * 2.4 + t * 0.9) * 0.6 +
        Math.sin(z * 3.2 + t * 1.7) * 0.4
      const s = 1 + n * pulse
      arr[i] = x * s
      arr[i + 1] = y * s
      arr[i + 2] = z * s
    }
    posAttr.needsUpdate = true
    if (frame % 2 === 0) blobGeo.computeVertexNormals()
    blob.rotation.y = t * 0.2
    blob.rotation.x = Math.sin(t * 0.3) * 0.3

    // Ring spin: idle drift + drag inertia + scroll velocity.
    spinVel *= 0.94
    spin += 0.0018 + spinVel + scrollVel * 0.00012
    ring.rotation.y = spin

    // Scroll: lift the scene and push the ring away as the hero leaves.
    const p = Math.min(scroll, 1)
    ring.position.y = THREE.MathUtils.lerp(ring.position.y, p * 2.2, 0.08)
    blob.position.y = ring.position.y
    const sc = 1 - p * 0.25
    ring.scale.setScalar(THREE.MathUtils.lerp(ring.scale.x, sc, 0.08))

    // Hover
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(panels.map((p) => p.front))
    const next = hits.length ? hits[0].object.userData.index : -1
    if (next !== hovered) {
      hovered = next
      onHover(hovered)
      canvas.style.cursor = hovered >= 0 ? 'none' : ''
    }
    panels.forEach(({ holder }, i) => {
      const target = i === hovered ? 1 : 0
      holder.userData.hover += (target - holder.userData.hover) * 0.12
      const h = holder.userData.hover
      holder.scale.setScalar(1 + h * 0.12)
      holder.position.setLength(radius + h * 0.6)
    })

    dust.rotation.y = t * 0.02
    camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.04
    camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.04
    camera.lookAt(0, ring.position.y * 0.6, 0)

    renderer.render(scene, camera)
    requestAnimationFrame(tick)
  }
  tick()

  return {
    setScroll(progress, velocity) {
      scroll = progress
      scrollVel = velocity
    },
  }
}
