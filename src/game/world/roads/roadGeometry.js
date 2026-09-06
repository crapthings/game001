const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t) }
export const roadPoints = (road) => road.points || [road.from, road.to]

// 用二次曲线圆滑折线拐角；最终保存采样路径，渲染、地图和避让共用。
export function roundRoadPath(points, radius = 24, closed = false) {
  const output = []
  for (let index = 0; index < points.length; index += 1) {
    const p = points[index]
    if (!closed && (index === 0 || index === points.length - 1)) { output.push([...p]); continue }
    const before = points[(index - 1 + points.length) % points.length], after = points[(index + 1) % points.length]
    const a = Math.hypot(before[0] - p[0], before[1] - p[1]), b = Math.hypot(after[0] - p[0], after[1] - p[1])
    if (!a || !b) continue
    const cut = Math.min(radius, a / 3, b / 3)
    const start = [p[0] + (before[0] - p[0]) * cut / a, p[1] + (before[1] - p[1]) * cut / a]
    const end = [p[0] + (after[0] - p[0]) * cut / b, p[1] + (after[1] - p[1]) * cut / b]
    const steps = Math.max(4, Math.ceil(cut / 3))
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps, u = 1 - t
      output.push([u * u * start[0] + 2 * u * t * p[0] + t * t * end[0], u * u * start[1] + 2 * u * t * p[1] + t * t * end[1]])
    }
  }
  if (closed && output.length) output.push([...output[0]])
  return output
}

function project(segment, x, z) {
  const t = Math.max(0, Math.min(1, ((x - segment.ax) * segment.dx + (z - segment.az) * segment.dz) / segment.lengthSquared))
  return { t, distance: Math.hypot(x - segment.ax - t * segment.dx, z - segment.az - t * segment.dz) }
}

export function compileRoadNetwork(roads) {
  const segments = []
  roads.forEach((road, roadIndex) => {
    const points = roadPoints(road), own = []
    let total = 0
    for (let i = 1; i < points.length; i += 1) {
      const [ax, az] = points[i - 1], [bx, bz] = points[i], dx = bx - ax, dz = bz - az, length = Math.hypot(dx, dz)
      if (!length) continue
      own.push({ roadIndex, ax, az, bx, bz, dx, dz, length, lengthSquared: length * length, offset: total, width: road.width, markings: road.markings !== false, sidewalk: Boolean(road.sidewalk) })
      total += length
    }
    for (const segment of own) segments.push({ ...segment, total, start: points[0], end: points.at(-1), closed: Boolean(road.closed) })
  })
  const connected = (point, own) => segments.some((segment) => segment.roadIndex !== own && project(segment, ...point).distance < segment.width / 2 + 0.5)
  const ends = new Map()
  for (const segment of segments) {
    const road = roads[segment.roadIndex]
    if (!ends.has(segment.roadIndex)) ends.set(segment.roadIndex, { fadeStart: road.fadeStart ?? (!segment.closed && !connected(segment.start, segment.roadIndex)), fadeEnd: road.fadeEnd ?? (!segment.closed && !connected(segment.end, segment.roadIndex)) })
    Object.assign(segment, ends.get(segment.roadIndex))
  }
  return segments
}

// 最大覆盖而非单纯最近中心线：宽窄道路相接时不会在交叉口留下裂口。
export function sampleRoad(segments, x, z) {
  let best = null, bestEdge = Infinity, junction = false
  for (const segment of segments) {
    const { t, distance } = project(segment, x, z)
    const along = segment.offset + t * segment.length
    const fade = Math.min(segment.fadeStart ? smooth(along / 16) : 1, segment.fadeEnd ? smooth((segment.total - along) / 16) : 1)
    const width = segment.width * fade
    const edge = distance - width / 2
    if (edge < bestEdge) {
      if (best && distance < width / 2 + 2 && best.distance < best.width / 2 + 2 && Math.abs(segment.dx * best.segment.dz - segment.dz * best.segment.dx) / (segment.length * best.segment.length) > 0.3) junction = true
      bestEdge = edge
      best = { distance, width, fade, along, segment }
    } else if (best && distance < width / 2 + 2 && best.distance < best.width / 2 + 2 && Math.abs(segment.dx * best.segment.dz - segment.dz * best.segment.dx) / (segment.length * best.segment.length) > 0.3) junction = true
  }
  return best ? { ...best, junction } : { distance: Infinity, width: 0, fade: 0, junction: false }
}
