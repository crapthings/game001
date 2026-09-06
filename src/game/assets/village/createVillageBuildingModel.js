import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { createRandom } from '../../world/generation/random.js'
import { HUMAN_SCALE } from '../../world/worldMetrics.js'

// 通用结构件 + 功能部件组合；不依赖城镇坐标，也不在模型内生成院落。
export function createVillageBuildingModel(scene, definition, material) {
  const { assetId, width: w, depth: d, floors, floorHeight, feature } = definition
  const random = createRandom(definition.modelSeed, 'wear')
  const parts = [], base = 0.3, height = floors * floorHeight, front = d / 2, roofY = base + height
  const wall = definition.palette, roof = definition.accent
  const concrete = '#77776c', dark = '#29322f', wood = '#79674f', rust = '#80553d', metal = '#737e78'
  function box(name, size, position, color, rotation = [0, 0, 0]) {
    const mesh = MeshBuilder.CreateBox(`${assetId}/${name}`, { width: size[0], height: size[1], depth: size[2] }, scene)
    mesh.position.set(...position); mesh.rotation.set(...rotation); mesh.material = material(color)
    parts.push(mesh)
    return mesh
  }
  function cylinder(name, diameter, h, position, color, rotation = [0, 0, 0]) {
    const mesh = MeshBuilder.CreateCylinder(`${assetId}/${name}`, { diameter, height: h, tessellation: 8 }, scene)
    mesh.position.set(...position); mesh.rotation.set(...rotation); mesh.material = material(color)
    parts.push(mesh)
  }
  function gable() {
    const half = w / 2 + 0.35, rise = 1.5, angle = Math.atan2(rise, half)
    for (const side of [-1, 1]) {
      box('roof-panel', [Math.hypot(half, rise), 0.2, d + 0.8], [side * half / 2, roofY + rise / 2, 0], roof, [0, 0, -side * angle])
      for (let level = 0; level < 8; level += 1) box('gable-infill', [w * (1 - (level + 0.5) / 8), rise / 8 + 0.02, 0.15], [0, roofY + (level + 0.5) * rise / 8, side * front], wall)
      for (let rib = 0; rib < 7; rib += 1) box('roof-seam', [Math.hypot(half, rise), 0.035, 0.055], [side * half / 2, roofY + rise / 2 + 0.12, -front + rib * d / 6], concrete, [0, 0, -side * angle])
    }
    box('ridge', [0.18, 0.2, d + 0.9], [0, roofY + rise, 0], metal)
  }
  function awning(width, color = roof) {
    box('awning', [width, 0.15, 1.6], [0, 2.85, front + 0.65], color, [0.07, 0, 0])
    for (const x of [-width / 2 + 0.2, width / 2 - 0.2]) box('awning-post', [0.12, 2.5, 0.12], [x, 1.55, front + 1.3], wood)
  }
  function sign(color) { box('blank-sign', [w - 1.5, 0.65, 0.16], [0, roofY - 0.5, front + 0.13], color) }
  function shutter(x, width) {
    box('shutter-frame', [width + 0.25, 3.3, 0.16], [x, 1.95, front + 0.1], roof)
    box('shutter', [width, 3, 0.18], [x, 1.8, front + 0.22], metal)
    for (let i = 0; i < 10; i += 1) box('shutter-rib', [width, 0.04, 0.06], [x, 0.4 + i * 0.29, front + 0.34], dark)
  }
  box('foundation', [w + 1, base, d + 1], [0, base / 2, 0], concrete)
  box('shell', [w, height, d], [0, base + height / 2, 0], wall)
  box('damp-course', [w + 0.06, 0.5, d + 0.06], [0, base + 0.25, 0], concrete)
  const industrial = ['repair', 'grain'].includes(feature)
  for (let floor = 0; floor < floors; floor += 1) {
    for (const side of [-1, 1]) for (const x of [-w * 0.3, w * 0.3]) {
      if (industrial && side === 1) continue
      const y = base + floor * floorHeight + 1.75, z = side * (front + 0.08)
      box('window-frame', [1.5, 1.35, 0.14], [x, y, z], concrete)
      box('window-dark', [1.25, 1.1, 0.16], [x, y, z + side * 0.08], dark)
      box('window-bar', [0.06, 1.15, 0.18], [x, y, z + side * 0.13], metal)
      if (random() < 0.65) box('window-board', [1.6, 0.18, 0.2], [x, y, z + side * 0.18], wood, [0, 0, (random() - 0.5) * 0.5])
    }
  }
  box('door-frame', [HUMAN_SCALE.doorWidth + 0.24, HUMAN_SCALE.doorHeight + 0.24, 0.18], [0, base + (HUMAN_SCALE.doorHeight + 0.24) / 2, front + 0.09], concrete)
  box('door', [HUMAN_SCALE.doorWidth, HUMAN_SCALE.doorHeight, 0.2], [0, base + HUMAN_SCALE.doorHeight / 2, front + 0.2], dark)
  box('step', [1.5, 0.15, 0.8], [0, 0.075, front + 0.6], concrete)
  if (['cistern', 'balcony', 'water', 'radio'].includes(feature)) {
    box('flat-roof', [w + 0.4, 0.22, d + 0.4], [0, roofY, 0], concrete)
    for (const side of [-1, 1]) box('roof-edge', [w + 0.3, 0.3, 0.15], [0, roofY + 0.2, side * front], roof)
  } else gable()

  if (feature === 'porch') {
    awning(4)
    box('chimney', [0.65, 1.8, 0.65], [-2, roofY + 1, -2], rust)
    for (let row = 0; row < 5; row += 1) for (let col = 0; col < 5; col += 1) box('exposed-brick', [0.45, 0.14, 0.08], [-w / 2 + 0.4 + col * 0.52 + (row % 2) * 0.2, 0.8 + row * 0.2, front + 0.055], '#6f5140')
  }
  if (feature === 'cistern') {
    cylinder('roof-cistern', 1.8, 1.6, [-2, roofY + 0.9, -1.5], metal)
    cylinder('downpipe', 0.13, height, [-w / 2 + 0.25, height / 2 + base, front + 0.2], rust)
    awning(2.8)
  }
  if (feature === 'farm') {
    awning(w - 1, wood)
    box('storage-hatch', [2.3, 1.5, 0.18], [0, roofY + 0.45, front + 0.15], wood)
    for (const x of [-3.8, 3.8]) box('wood-stack', [1.5, 0.7, 0.8], [x, 0.65, front + 0.65], wood)
  }
  if (feature === 'balcony') {
    box('balcony-slab', [w - 1, 0.2, 1.5], [0, 3.3, front + 0.6], concrete)
    box('balcony-rail', [w - 1, 0.1, 0.12], [0, 4.25, front + 1.25], metal)
    for (let i = 0; i < 9; i += 1) box('rail-post', [0.07, 0.95, 0.08], [-4 + i, 3.8, front + 1.25], metal)
    box('solar-panel', [2.6, 0.1, 1.5], [-2, roofY + 0.5, -1], '#394a4f', [0.3, 0, 0])
  }
  if (feature === 'store') {
    sign('#61766b'); awning(w - 0.5)
    box('closed-display', [2.7, 1.4, 0.2], [-3, 1.6, front + 0.3], dark)
    box('empty-freezer', [1.8, 0.9, 0.8], [3, 0.75, front + 0.8], '#a2a294')
    box('freezer-lid', [1.85, 0.08, 0.85], [3, 1.24, front + 0.8], metal)
  }
  if (feature === 'clinic') {
    sign('#75877e'); awning(3.2)
    for (const size of [[0.25, 0.95, 0.22], [0.9, 0.25, 0.22]]) box('medical-symbol', size, [0, roofY - 0.48, front + 0.25], '#c6c5b2')
    box('supply-cabinet', [1.1, 1.6, 0.65], [3.2, 1.1, front + 0.5], '#a3a595')
  }
  if (feature === 'water') {
    cylinder('water-tank', 2.8, 3, [0, roofY + 1.6, 0], metal)
    cylinder('tank-rim', 2.95, 0.16, [0, roofY + 3.1, 0], dark)
    cylinder('delivery-pipe', 0.22, height + 2, [2, (height + 2) / 2 + base, front + 0.3], rust)
    box('pump-cabinet', [2.2, 1.4, 1], [-2.5, 1, front + 0.7], roof)
  }
  if (feature === 'repair') {
    shutter(-2.6, 4.3); shutter(2.6, 4.3)
    box('work-canopy', [w, 0.2, 1.5], [0, 3.85, front + 0.6], rust)
    for (let i = 0; i < 3; i += 1) cylinder('tire-stack', 0.9, 0.25, [-5.2, 0.45 + i * 0.25, front + 0.8], dark)
    box('vent', [1.2, 1.2, 1.2], [3, roofY + 0.9, -3], metal)
  }
  if (feature === 'grain') {
    shutter(0, 4.5)
    box('loading-dock', [w - 0.5, 0.5, 1.5], [0, 0.25, front + 0.65], concrete)
    for (const x of [-4.5, 4.5]) for (let i = 0; i < 3; i += 1) box('grain-sack', [1.4, 0.35, 0.8], [x, 0.7 + i * 0.35, front + 0.7], '#a39670')
    box('roof-vent', [2.5, 0.65, 1.4], [0, roofY + 1.7, -2], metal)
  }
  if (feature === 'radio') {
    sign('#657769')
    cylinder('mast', 0.14, 5, [-2, roofY + 2.5, -2], rust)
    for (const y of [roofY + 3, roofY + 4.3]) box('antenna', [2, 0.07, 0.08], [-2, y, -2], metal)
    for (const x of [-2.45, -1.55]) cylinder('loudspeaker', 0.5, 0.6, [x, roofY + 2.5, -1.7], metal, [Math.PI / 2, 0, 0])
    box('noticeboard', [2.7, 1.3, 0.16], [3, 1.7, front + 0.22], wood)
    for (let i = 0; i < 3; i += 1) box('faded-notice', [0.55, 0.8, 0.04], [2.2 + i * 0.75, 1.7, front + 0.32], '#ada78e')
  }
  // 固定 seed 的脱灰、锈迹、补板；不使用每次加载变化的随机数。
  for (let i = 0; i < 12; i += 1) {
    const side = i % 2 ? -1 : 1
    box('wall-wear', [0.3 + random(), 0.15 + random() * 0.5, 0.07], [(random() - 0.5) * (w - 0.5), 0.55 + random() * (height - 0.5), side * (front + 0.06)], i % 3 ? concrete : rust)
  }
  const groups = new Map()
  for (const part of parts) {
    if (!groups.has(part.material)) groups.set(part.material, [])
    groups.get(part.material).push(part)
  }
  const merged = [...groups.values()].map((group) => Mesh.MergeMeshes(group, true, true))
  const mesh = Mesh.MergeMeshes(merged, true, true, undefined, false, true)
  mesh.name = assetId
  mesh.metadata = { buildingId: definition.id, footprint: definition.footprint, entrance: definition.entrance, revision: definition.revision }
  return mesh
}
