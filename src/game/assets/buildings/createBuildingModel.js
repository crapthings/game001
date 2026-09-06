import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { createRandom } from '../../world/generation/random.js'
import { HUMAN_SCALE } from '../../world/worldMetrics.js'

// 所有部件先按材质合并，再合为共享模板；运行时通过 createInstance 复用。
export function createBuildingModel(scene, definition, material) {
  const { id, width: w, depth: d, floors, floorHeight, palette, accent } = definition
  const random = createRandom(definition.modelSeed, 'details')
  const parts = []
  const wall = material(palette), trim = material('#5d605c'), concrete = material('#666963')
  const dark = material('#252f30'), metal = material('#707977'), rust = material('#7e513d')
  const wood = material('#71624b'), accentMaterial = material(accent)
  function box(name, width, height, depth, x, y, z, mat, rotation = 0) {
    const mesh = MeshBuilder.CreateBox(`${id}:${name}`, { width, height, depth }, scene)
    mesh.position.set(x, y, z)
    mesh.rotation.z = rotation
    mesh.material = mat
    parts.push(mesh)
    return mesh
  }
  function cylinder(name, diameter, height, x, y, z, mat) {
    const mesh = MeshBuilder.CreateCylinder(`${id}:${name}`, { diameter, height, tessellation: 6 }, scene)
    mesh.position.set(x, y, z)
    mesh.material = mat
    parts.push(mesh)
    return mesh
  }
  const slab = 0.35
  const height = floors * floorHeight
  box('foundation', w + 1.2, slab, d + 1.2, 0, slab / 2, 0, concrete)
  function windows(bodyWidth, bodyDepth, bodyHeight, bodyZ = 0) {
    for (let floor = 0; floor < floors; floor += 1) {
      const y = slab + floor * floorHeight + 1.8
      if (y >= bodyHeight + slab) continue
      const columns = Math.max(2, Math.floor(bodyWidth / 2.7))
      for (let col = 0; col < columns; col += 1) {
        const x = -bodyWidth / 2 + (col + 0.5) * bodyWidth / columns
        for (const side of [-1, 1]) {
          if (floor === 0 && side === 1 && Math.abs(x) < 1.8) continue
          const z = bodyZ + side * (bodyDepth / 2 + 0.06)
          box('window-frame', 1.6, 1.5, 0.12, x, y, z, trim)
          box('window', 1.35, 1.25, 0.14, x, y, z + side * 0.06, dark)
          box('window-mullion', 0.07, 1.26, 0.17, x, y, z + side * 0.08, metal)
          if (random() < 0.34) {
            box('board', 1.75, 0.22, 0.22, x, y, z + side * 0.16, wood, (random() - 0.5) * 0.5)
            box('board', 1.75, 0.2, 0.22, x, y - 0.4, z + side * 0.16, wood)
          }
        }
      }
      for (const side of [-1, 1]) {
        for (let row = 0; row < 3; row += 1) {
          const z = bodyZ + (row - 1) * bodyDepth / 3.5
          box('side-window-frame', 0.12, 1.5, 1.6, side * (bodyWidth / 2 + 0.05), y, z, trim)
          box('side-window', 0.15, 1.2, 1.35, side * (bodyWidth / 2 + 0.12), y, z, dark)
        }
      }
    }
  }
  function flatRoof(bodyWidth, bodyDepth, roofY, z = 0) {
    box('roof', bodyWidth + 0.35, 0.24, bodyDepth + 0.35, 0, roofY, z, trim)
    for (const side of [-1, 1]) {
      box('parapet', bodyWidth + 0.4, 0.55, 0.2, 0, roofY + 0.3, z + side * bodyDepth / 2, wall)
      box('parapet', 0.2, 0.55, bodyDepth, side * bodyWidth / 2, roofY + 0.3, z, wall)
    }
    box('rooftop-ac', 1.7, 0.8, 1.2, -bodyWidth / 4, roofY + 0.5, z - 1, metal)
    for (let index = 0; index < 5; index += 1) box('ac-grille', 1.4, 0.04, 0.05, -bodyWidth / 4, roofY + 0.32 + index * 0.12, z - 0.37, dark)
    cylinder('vent', 0.45, 1.1, bodyWidth / 4, roofY + 0.65, z - bodyDepth / 4, rust)
  }
  function pitchedRoof(roofY) {
    const rise = 1.9, half = w / 2 + 0.45
    const angle = Math.atan2(rise, half)
    const panelWidth = Math.hypot(half, rise)
    box('roof-left', panelWidth, 0.22, d + 0.8, -half / 2, roofY + rise / 2, 0, trim, angle)
    box('roof-right', panelWidth, 0.22, d + 0.8, half / 2, roofY + rise / 2, 0, accentMaterial, -angle)
    // 水平窄条填充山墙，保持封闭轮廓而无需贴图。
    for (let level = 0; level < 10; level += 1) {
      const stripWidth = w * (1 - (level + 0.5) / 10)
      for (const side of [-1, 1]) box('gable', stripWidth, rise / 10 + 0.02, 0.15, 0, roofY + (level + 0.5) * rise / 10, side * d / 2, wall)
    }
    box('chimney', 0.65, 2.2, 0.7, -w / 4, roofY + 1.2, -d / 4, rust)
  }
  if (id === 'gas-station') {
    box('station-kiosk', w - 1, 3, 4.2, 0, 1.85, -d / 2 + 2.1, wall)
    box('kiosk-glass', w - 3, 1.5, 0.12, 0, 1.9, -d / 2 + 4.26, dark)
    flatRoof(w - 1, 4.2, 3.45, -d / 2 + 2.1)
    box('canopy', w + 0.4, 0.5, 6, 0, 4.8, 2.8, accentMaterial)
    box('canopy-edge', w + 0.5, 0.15, 6.1, 0, 5.08, 2.8, concrete)
    for (const x of [-w / 2 + 1, w / 2 - 1]) cylinder('canopy-pillar', 0.32, 4.3, x, 2.5, 2.8, metal)
    for (const x of [-3, 0, 3]) {
      box('pump-island', 1.7, 0.22, 2.1, x, 0.45, 2.8, concrete)
      box('fuel-pump', 0.75, 1.5, 0.6, x, 1.3, 2.8, accentMaterial)
      box('pump-display', 0.55, 0.4, 0.05, x, 1.7, 3.13, dark)
      cylinder('bollard', 0.15, 0.8, x - 0.65, 0.9, 3.6, rust)
    }
  } else {
    box('shell', w, height, d, 0, slab + height / 2, 0, wall)
    box('base-course', w + 0.08, 0.6, d + 0.08, 0, slab + 0.3, 0, concrete)
    windows(w, d, height)
    const front = d / 2
    box('door-frame', HUMAN_SCALE.doorWidth + 0.24, HUMAN_SCALE.doorHeight + 0.24, 0.17, 0, slab + (HUMAN_SCALE.doorHeight + 0.24) / 2, front + 0.06, trim)
    box('door', HUMAN_SCALE.doorWidth, HUMAN_SCALE.doorHeight, 0.2, 0, slab + HUMAN_SCALE.doorHeight / 2, front + 0.14, dark)
    box('door-handle', 0.07, 0.38, 0.25, 0.42, 1.35, front + 0.25, metal)
    box('step', 1.5, 0.2, 0.7, 0, 0.1, front + 0.5, concrete)
    if (definition.roof === 'gable') pitchedRoof(slab + height)
    else flatRoof(w, d, slab + height)
    for (let floor = 1; floor < floors; floor += 1) box('floor-band', w + 0.2, 0.18, d + 0.2, 0, slab + floor * floorHeight, 0, concrete)
    if (id === 'house' || id === 'townhouse') {
      box('porch-roof', 3.5, 0.2, 1.6, 0, 3.1, front + 0.7, accentMaterial)
      for (const x of [-1.5, 1.5]) box('porch-post', 0.15, 2.8, 0.15, x, 1.55, front + 1.2, wood)
      if (id === 'townhouse') box('facade-stripe', 0.45, height, 0.15, -w / 2 + 0.8, slab + height / 2, front + 0.1, accentMaterial)
    }
    if (id === 'apartments') {
      for (let floor = 1; floor < floors; floor += 1) {
        for (const x of [-3.7, 3.7]) {
          const y = slab + floor * floorHeight
          box('balcony', 2.6, 0.18, 1.2, x, y, front + 0.5, concrete)
          box('balcony-rail', 2.6, 0.08, 0.1, x, y + 0.9, front + 1, metal)
          for (const dx of [-1.15, 0, 1.15]) box('balcony-post', 0.08, 0.9, 0.08, x + dx, y + 0.45, front + 1, metal)
        }
      }
      box('roof-access', 2.6, 1.8, 2.3, 2.6, slab + height + 1, -2, wall)
    }
    if (['corner-store', 'diner', 'clinic', 'police'].includes(id)) {
      box('sign-board', w - 1.4, 0.72, 0.22, 0, height + slab - 0.65, front + 0.2, accentMaterial)
      if (id === 'corner-store' || id === 'diner') {
        box('awning', w + 0.3, 0.18, 1.4, 0, 2.95, front + 0.6, accentMaterial)
        for (const side of [-1, 1]) box('shopfront', 3, 1.7, 0.18, side * 3.1, 1.65, front + 0.17, dark)
        if (id === 'diner') {
          for (const x of [-3, 3]) box('outside-bench', 2, 0.35, 0.55, x, 0.65, front + 1, wood)
          box('exhaust', 0.8, 1.8, 0.8, w / 2 - 1.2, height + 1, -d / 2 + 1.2, metal)
        }
      }
      if (id === 'clinic') {
        const white = material('#c7c8b8')
        box('medical-cross-h', 1.25, 0.35, 0.3, 0, height - 0.28, front + 0.36, white)
        box('medical-cross-v', 0.35, 1.25, 0.3, 0, height - 0.28, front + 0.36, white)
      }
      if (id === 'police') {
        cylinder('radio-mast', 0.1, 4, w / 3, height + 2.6, -d / 3, metal)
        box('antenna', 1.8, 0.08, 0.08, w / 3, height + 3.3, -d / 3, metal)
        for (const x of [-3, 3]) for (let bar = -1; bar <= 1; bar += 1) box('security-bars', 0.07, 1.5, 0.22, x + bar * 0.45, 1.9, front + 0.28, metal)
      }
    }
    if (id === 'workshop' || id === 'warehouse') {
      const bays = id === 'workshop' ? [-3, 3] : [0]
      for (const x of bays) {
        box('loading-frame', 4.5, 3.6, 0.25, x, 2.05, front + 0.15, accentMaterial)
        box('shutter', 4, 3.2, 0.28, x, 1.9, front + 0.25, metal)
        for (let line = 0; line < 10; line += 1) box('shutter-slats', 3.9, 0.04, 0.32, x, 0.5 + line * 0.29, front + 0.3, trim)
      }
      if (id === 'warehouse') {
        box('dock', w + 0.8, 0.45, 1.4, 0, 0.35, front + 0.6, concrete)
        for (const x of [-4.5, 4.5]) box('shipping-crate', 1.3, 1.3, 1.2, x, 1.2, front + 0.6, wood)
      } else {
        for (let index = 0; index < 3; index += 1) cylinder('discarded-tire', 0.8, 0.25, -w / 2 + 0.6, 0.5 + index * 0.25, front + 0.7, dark)
      }
    }
    // 每个模板固定的破损痕迹：锈斑、墙面补丁、杂草及落瓦，不随加载闪变。
    for (let index = 0; index < 7; index += 1) {
      const side = random() > 0.5 ? 1 : -1
      box('weathering', 0.4 + random() * 1.4, 0.15 + random() * 0.6, 0.08, (random() - 0.5) * (w - 1), slab + 0.4 + random() * (height - 0.7), side * (d / 2 + 0.06), index % 2 ? concrete : rust)
    }
  }
  for (let index = 0; index < 5; index += 1) {
    const x = (random() - 0.5) * w
    box('rubble', 0.3 + random() * 0.45, 0.12, 0.25, x, slab + 0.08, -d / 2 - random() * 0.5, concrete, random() * 0.2)
  }
  const buckets = new Map()
  for (const part of parts) {
    if (!buckets.has(part.material)) buckets.set(part.material, [])
    buckets.get(part.material).push(part)
  }
  const mergedGroups = [...buckets.values()].map((group) => Mesh.MergeMeshes(group, true, true, undefined, false, false))
  const result = Mesh.MergeMeshes(mergedGroups, true, true, undefined, false, true)
  result.name = definition.assetId
  result.metadata = { buildingId: id, footprint: definition.footprint, entrance: definition.entrance, revision: definition.revision }
  return result
}
