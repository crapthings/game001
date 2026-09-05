import { FOG_CELL_SIZE, REVEAL_RADIUS, isExplored } from './fog.js'

// 只读取规划与探索数据，不触发区块生成或素材加载。北方为世界 +Z。
export function drawMap(ctx, width, height, { center, span, position, heading, fog, plan, radar }) {
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#080e0e'
  ctx.fillRect(0, 0, width, height)
  const scale = Math.min(width, height) / span
  const screen = (x, z) => [width / 2 + (x - center.x) * scale, height / 2 - (z - center.z) * scale]
  const xMin = center.x - width / (2 * scale), xMax = center.x + width / (2 * scale)
  const zMin = center.z - height / (2 * scale), zMax = center.z + height / (2 * scale)
  const cells = []
  for (let z = Math.floor(zMin / FOG_CELL_SIZE); z <= Math.floor(zMax / FOG_CELL_SIZE); z += 1) {
    for (let x = Math.floor(xMin / FOG_CELL_SIZE); x <= Math.floor(xMax / FOG_CELL_SIZE); x += 1) {
      if (!isExplored(fog, (x + 0.5) * FOG_CELL_SIZE, (z + 0.5) * FOG_CELL_SIZE)) continue
      const [sx, sy] = screen(x * FOG_CELL_SIZE, (z + 1) * FOG_CELL_SIZE)
      cells.push([sx, sy])
    }
  }
  ctx.save()
  if (radar) {
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 2 - 3, 0, Math.PI * 2)
    ctx.clip()
  }
  // 所有地图要素都受已探索格裁切，未知区不会泄露建筑或地名。
  ctx.beginPath()
  for (const [x, y] of cells) ctx.rect(x, y, FOG_CELL_SIZE * scale + 0.5, FOG_CELL_SIZE * scale + 0.5)
  ctx.clip()
  ctx.fillStyle = '#293c35'
  ctx.fillRect(0, 0, width, height)
  for (const region of plan.regions) {
    const [x, y] = screen(...region.center)
    ctx.fillStyle = region.color
    ctx.globalAlpha = 0.25
    ctx.beginPath()
    ctx.arc(x, y, region.radius * scale, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  for (const town of plan.settlements || []) {
    const b = town.bounds
    if (b.maxX < xMin || b.minX > xMax || b.maxZ < zMin || b.minZ > zMax) continue
    const [tx, ty] = screen(b.minX, b.maxZ)
    ctx.fillStyle = '#41453b'
    ctx.fillRect(tx, ty, (b.maxX - b.minX) * scale, (b.maxZ - b.minZ) * scale)
    for (const road of town.roads) {
      const from = screen(...road.from), to = screen(...road.to)
      ctx.strokeStyle = '#a29b75'
      ctx.lineWidth = Math.max(1, road.width * scale)
      ctx.beginPath()
      ctx.moveTo(...from)
      ctx.lineTo(...to)
      ctx.stroke()
    }
    for (const building of town.placements) {
      const [x, y] = screen(building.position[0], building.position[2])
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(building.rotation)
      ctx.fillStyle = '#b7b4a1'
      const w = building.footprint.width * building.scale * scale, d = building.footprint.depth * building.scale * scale
      ctx.fillRect(-w / 2, -d / 2, w, d)
      ctx.strokeStyle = '#171e1c'
      ctx.lineWidth = 1
      ctx.strokeRect(-w / 2, -d / 2, w, d)
      ctx.restore()
    }
  }
  // 已探索但不在当前观察范围内的区域压暗；刷新后仍保留探索记忆。
  const [px, py] = screen(position.x, position.z)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, width, height)
  ctx.moveTo(px + REVEAL_RADIUS * scale, py)
  ctx.arc(px, py, REVEAL_RADIUS * scale, 0, Math.PI * 2, true)
  ctx.clip('evenodd')
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
  ctx.restore()

  // 坐标参考网格可跨越未知区；它不包含任何世界内容。
  ctx.save()
  if (radar) {
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 2 - 3, 0, Math.PI * 2)
    ctx.clip()
  }
  const grid = span > 400 ? 128 : span > 180 ? 64 : 32
  ctx.strokeStyle = 'rgba(164, 184, 162, 0.09)'
  ctx.lineWidth = 1
  for (let x = Math.ceil(xMin / grid) * grid; x <= xMax; x += grid) {
    const [sx] = screen(x, 0)
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, height); ctx.stroke()
  }
  for (let z = Math.ceil(zMin / grid) * grid; z <= zMax; z += grid) {
    const [, sy] = screen(0, z)
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(width, sy); ctx.stroke()
  }
  if (!radar) {
    ctx.font = '12px system-ui'
    ctx.textAlign = 'center'
    for (const town of plan.settlements || []) {
      const x = (town.bounds.minX + town.bounds.maxX) / 2, z = (town.bounds.minZ + town.bounds.maxZ) / 2
      if (!isExplored(fog, x, z)) continue
      const [sx, sy] = screen(x, z)
      ctx.fillStyle = '#eee1b6'
      ctx.fillText(town.name, sx, sy - 13)
    }
  }
  if (px >= 0 && py >= 0 && px <= width && py <= height) {
    ctx.strokeStyle = 'rgba(150, 227, 187, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(px, py, REVEAL_RADIUS * scale, 0, Math.PI * 2); ctx.stroke()
    ctx.translate(px, py)
    ctx.rotate(heading)
    ctx.shadowBlur = 10
    ctx.shadowColor = '#81e0b6'
    ctx.fillStyle = '#bcf5d8'
    ctx.strokeStyle = '#0c1d16'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(0, 3); ctx.lineTo(-6, 6); ctx.closePath()
    ctx.fill(); ctx.stroke()
  }
  ctx.restore()
  if (radar) {
    ctx.strokeStyle = '#708574'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(width / 2, height / 2, Math.min(width, height) / 2 - 3, 0, Math.PI * 2); ctx.stroke()
  }
  ctx.fillStyle = '#b8c5b7'
  ctx.font = 'bold 11px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('N', width / 2, 14)
}
