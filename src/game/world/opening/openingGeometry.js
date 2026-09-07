// 开场的规划、地面与散布共用世界空间约束，不依赖渲染引擎。
export function overlapsBounds(a, b, margin = 0) {
  return a.minX - margin < b.maxX && a.maxX + margin > b.minX && a.minZ - margin < b.maxZ && a.maxZ + margin > b.minZ
}

export function openingContains(opening, x, z, margin = 0) {
  const b = opening?.bounds
  return Boolean(b && x >= b.minX - margin && x <= b.maxX + margin && z >= b.minZ - margin && z <= b.maxZ + margin)
}

export function openingWeight(opening, x, z) {
  if (!opening) return 0
  const { core, blend } = opening.grading
  const outside = Math.max(core.minX - x, x - core.maxX, core.minZ - z, z - core.maxZ, 0)
  const t = Math.min(1, outside / blend)
  return 1 - t * t * (3 - 2 * t)
}

export function openingBlocksPlacement(opening, placement, definition = {}) {
  if (!opening) return false
  const footprint = placement.footprint || definition.footprint
  // 外接圆保守覆盖旋转后的实体，避免仅排除中心位于场景内的树木。
  const radius = footprint ? Math.hypot(footprint.width, footprint.depth) / 2 : definition.radius ?? 4
  if (opening.clearanceVersion !== 2 || !placement.assetId.startsWith('nature.')) {
    return openingContains(opening, placement.position[0], placement.position[2], radius * (placement.scale ?? 1) + 2)
  }
  const scale = placement.scale ?? 1
  const shape = naturalShape(definition)
  const extent = shape.radius * scale, height = shape.height * scale
  const p = [placement.position[0], placement.position[2]]
  if (!openingContains(opening, ...p, extent)) return false
  const local = (u, v) => [opening.origin[0] + Math.cos(opening.yaw) * u + Math.sin(opening.yaw) * v,
    opening.origin[1] - Math.sin(opening.yaw) * u + Math.cos(opening.yaw) * v]
  // 车辆通道、下车点与路障两侧的步行通道。低矮地被也不遮住必经路线。
  if (segmentDistance(p, opening.entry, opening.parking.position) < 3.3 + extent) return true
  if (Math.hypot(p[0] - opening.playerExit[0], p[1] - opening.playerExit[1]) < 1.5 + extent) return true
  const walk = [opening.playerExit, local(7, 66), local(0, 80), opening.connectionPortal]
  const leftWalk = [local(-7, 42), local(-7, 66), local(0, 80)]
  if (leftWalk.slice(1).some((end, i) => segmentDistance(p, leftWalk[i], end) < 1.3 + extent)) return true
  if (walk.slice(1).some((end, i) => segmentDistance(p, walk[i], end) < 1.3 + extent)) return true
  if (segmentDistance(p, local(-5, 60), local(5, 60)) < 1 + extent) return true
  if (height > 0.8) {
    // 跟拍相机从局部 (10,0) 移至 (10,40)，视线扫过车道右侧。
    const dx = p[0] - opening.origin[0], dz = p[1] - opening.origin[1]
    const u = dx * Math.cos(opening.yaw) - dz * Math.sin(opening.yaw)
    const v = dx * Math.sin(opening.yaw) + dz * Math.cos(opening.yaw)
    if (u > -extent && u < 12 + extent && v > -2 - extent && v < 50 + extent) return true
    const shot = opening.shots.find(item => item.id === 'dialogue')
    if (shot && segmentDistance(p, [shot.position[0], shot.position[2]], opening.playerExit) < 3 + extent) return true
  }
  return false
}

function segmentDistance(p, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], length = dx * dx + dz * dz
  const t = length ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / length)) : 0
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t)
}

const shapes = new WeakMap()
export function naturalShape(definition) {
  if (shapes.has(definition)) return shapes.get(definition)
  let radius = definition.radius ?? 0.5, height = 0
  for (const part of definition.parts || []) {
    radius = Math.max(radius, Math.hypot(part.position[0], part.position[2]) + Math.hypot(part.size[0], part.size[2]) / 2)
    height = Math.max(height, part.position[1] + part.size[1] / 2)
  }
  const result = { radius, height }
  shapes.set(definition, result)
  return result
}
