// Helio set: sun-washed plinths, arch backdrop, palm-leaf shadows, tube + glass serum bottle.
import { THREE, loadTex, noiseCanvas, normalFromHeight, sweep, goboCanvas } from './stage.js'

const PLUM = '#3a2733'

function tube(map, { R = 0.021, L = 0.15 } = {}) {
  const g = new THREE.Group()
  const segU = 96, segV = 90
  const pos = [], uv = [], idx = []
  for (let j = 0; j <= segV; j++) {
    const t = j / segV
    const a = R * (1 + 0.2 * t), b = R * Math.max(0.02, 1 - 0.98 * Math.pow(t, 1.5))
    for (let i = 0; i <= segU; i++) {
      const u = i / segU, th = u * Math.PI * 2
      // round at the cap, flattening to a seam at the crimp; front panel (u = .25) faces +z
      pos.push(-a * Math.cos(th), t * L, b * Math.sin(th))
      uv.push(u, t)
    }
  }
  for (let j = 0; j < segV; j++)
    for (let i = 0; i < segU; i++) {
      const a = j * (segU + 1) + i, b = a + segU + 1
      idx.push(a, a + 1, b, b, a + 1, b + 1)
    }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  const body = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 }))
  body.position.y = 0.022
  // crimped seal
  const ridges = document.createElement('canvas'); ridges.width = 256; ridges.height = 16
  const rx = ridges.getContext('2d')
  for (let x = 0; x < 256; x += 4) { rx.fillStyle = x % 8 ? '#000' : '#fff'; rx.fillRect(x, 0, 2, 16) }
  const crimp = new THREE.Mesh(new THREE.BoxGeometry(R * 2.42, 0.012, 0.0022), new THREE.MeshPhysicalMaterial({ color: '#fbf6f2', roughness: 0.4, normalMap: normalFromHeight(ridges, 4) }))
  crimp.position.y = 0.022 + L + 0.004
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.9, 0.024, 64), new THREE.MeshPhysicalMaterial({ color: PLUM, roughness: 0.25, clearcoat: 0.8 }))
  cap.position.y = 0.012
  for (const m of [body, crimp, cap]) { m.castShadow = m.receiveShadow = true; g.add(m) }
  return g
}

function serum(labelMap) {
  const g = new THREE.Group()
  const prof = [[0.0001, 0], [0.026, 0], [0.029, 0.003], [0.03, 0.01], [0.03, 0.068], [0.028, 0.078], [0.02, 0.086], [0.0125, 0.09], [0.0125, 0.097], [0.0001, 0.097]].map(([x, y]) => new THREE.Vector2(x, y))
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), new THREE.MeshPhysicalMaterial({
    color: '#ffffff', transmission: 1, thickness: 0.004, ior: 1.5, roughness: 0.02, metalness: 0,
    attenuationColor: '#ffd6c4', attenuationDistance: 0.6, clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 1,
  }))
  const liquidProf = [[0.0001, 0.004], [0.026, 0.004], [0.027, 0.01], [0.027, 0.046], [0.0001, 0.046]].map(([x, y]) => new THREE.Vector2(x, y))
  const liquid = new THREE.Mesh(new THREE.LatheGeometry(liquidProf, 64), new THREE.MeshPhysicalMaterial({ color: '#ffa040', transmission: 0.55, thickness: 0.05, ior: 1.38, roughness: 0.08, attenuationColor: '#d9661f', attenuationDistance: 0.025 }))
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.0303, 0.0303, 0.036, 64, 1, true, -0.95, 1.9), new THREE.MeshPhysicalMaterial({ map: labelMap, roughness: 0.55, side: THREE.DoubleSide }))
  label.position.y = 0.036
  const plum = new THREE.MeshPhysicalMaterial({ color: PLUM, roughness: 0.3, clearcoat: 0.7 })
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0155, 0.018, 48), plum)
  collar.position.y = 0.105
  const bulbProf = [[0.0001, 0], [0.011, 0], [0.0115, 0.004], [0.0105, 0.02], [0.0085, 0.03], [0.004, 0.034], [0.0001, 0.0345]].map(([x, y]) => new THREE.Vector2(x, y))
  const bulb = new THREE.Mesh(new THREE.LatheGeometry(bulbProf, 48), new THREE.MeshPhysicalMaterial({ color: PLUM, roughness: 0.55, sheen: 0.4, sheenColor: '#8a6a7a' }))
  bulb.position.y = 0.114
  for (const m of [glass, liquid, label, collar, bulb]) { m.castShadow = m !== liquid; m.receiveShadow = true; g.add(m) }
  return g
}

function plinth(geo, color) {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.92, normalMap: normalFromHeight(noiseCanvas(256, { scale: 8, octaves: 4, seed: 6 }), 2), normalScale: new THREE.Vector2(0.25, 0.25) }))
  m.castShadow = m.receiveShadow = true
  return m
}

function arch(w, h, d, color) {
  const s = new THREE.Shape()
  s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0)
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 3, curveSegments: 64 })
  return plinth(geo, color)
}

export async function buildHelio(scene) {
  const plaster = normalFromHeight(noiseCanvas(512, { scale: 6, octaves: 5, seed: 13 }), 1.4)
  plaster.repeat.set(6, 6)
  const room = sweep({ width: 4, depth: 1.5, height: 1.6, radius: 0.25, color: '#f0bba3', roughness: 0.95, normalMap: plaster, normalScale: 0.22 })
  room.position.z = -0.3
  scene.add(room)

  const backArch = arch(0.32, 0.46, 0.03, '#e2896b'); backArch.position.set(0.0, 0, -0.29)
  const tall = plinth(new THREE.BoxGeometry(0.13, 0.15, 0.13), '#efc4ad'); tall.position.set(-0.05, 0.075, -0.07)
  const drum = plinth(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 96), '#f6e0d3'); drum.position.set(0.095, 0.03, 0.05)
  const step = plinth(new THREE.CylinderGeometry(0.055, 0.055, 0.022, 96), '#e9a98f'); step.position.set(-0.125, 0.011, 0.14)
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(0.04, 96, 64), new THREE.MeshPhysicalMaterial({ color: '#ff8a3c', roughness: 0.35, clearcoat: 0.6, sheen: 0.4, sheenColor: '#ffd08a' }))
  sunBall.position.set(-0.125, 0.062, 0.14); sunBall.castShadow = sunBall.receiveShadow = true
  scene.add(backArch, tall, drum, step, sunBall)

  const [tubeMap, serumMap] = await Promise.all([loadTex('../tex/out/helio-tube.png'), loadTex('../tex/out/helio-serum.png')])
  const t = tube(tubeMap); t.position.set(0.095, 0.06, 0.05); t.rotation.y = -0.18
  const s = serum(serumMap); s.scale.setScalar(1.15); s.position.set(-0.055, 0.15, -0.065); s.rotation.y = 0.2
  scene.add(t, s)

  const sun = new THREE.SpotLight('#fff0d8', 6.5, 0, 0.36, 0.25, 0)
  sun.position.set(1.0, 1.35, 0.95)
  sun.target.position.set(-0.02, 0.12, -0.02)
  sun.map = goboCanvas('leaves', 1024, 21)
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  sun.shadow.bias = -0.00006
  sun.shadow.normalBias = 0.001
  sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 4
  scene.add(sun, sun.target, new THREE.HemisphereLight('#ffe9e0', '#b5705c', 0.28))
}
