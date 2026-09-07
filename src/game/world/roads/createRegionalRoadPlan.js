import { defineRoad } from './roadProfiles.js'
import { roundRoadPath } from './roadGeometry.js'
import { createTerrainRouter } from './createTerrainRouter.js'

export function createRegionalRoadPlan(settlements, topography = null, obstacles = []) {
  const router = topography ? createTerrainRouter([...settlements, ...obstacles], topography) : null
  const candidates = []
  for (let from = 0; from < settlements.length; from += 1) for (let to = from + 1; to < settlements.length; to += 1) {
    let best
    for (const a of settlements[from].gates || [settlements[from].gate]) for (const b of settlements[to].gates || [settlements[to].gate]) {
      const cost = Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1])
      if (!best || cost < best.cost) best = { from, to, a, b, cost }
    }
    candidates.push(best)
  }
  candidates.sort((a,b) => a.cost-b.cost || a.from-b.from || a.to-b.to)
  const connected = new Set([0]), chosen = []
  while (connected.size < settlements.length) {
    const edge = candidates.find(item => connected.has(item.from) !== connected.has(item.to))
    if (!edge) break
    chosen.push(edge); connected.add(edge.from); connected.add(edge.to)
  }
  // 增加两条非树边，提供绕行路线，不让整个世界只有单一树状通路。
  chosen.push(...candidates.filter(edge => !chosen.includes(edge)).slice(0,2))
  return chosen.map(({ from,to,a,b }) => {
    if (router) {
      const pairs = []
      for (const start of settlements[from].gates || [settlements[from].gate]) for (const end of settlements[to].gates || [settlements[to].gate]) {
        pairs.push({ start, end, distance: Math.hypot(start[0] - end[0], start[1] - end[1]) })
      }
      pairs.sort((a, b) => a.distance - b.distance)
      for (const pair of pairs) {
        const result = router.route(from, to, pair.start, pair.end)
        if (result) return defineRoad(`link-${from}-${to}`, result.points, 'regional', { routing: result.routing })
      }
      throw new Error(`无法连接 ${settlements[from].name} 与 ${settlements[to].name}，请更换种子；未使用穿越聚落的直线路径。`)
    }
    const corners = [[b[0],a[1]],[a[0],b[1]]]
    const score = (corner) => {
      const points = [a,corner,b]
      let cost = 0
      for (let i=1;i<points.length;i+=1) {
        const p=points[i-1], q=points[i]
        for (let n=0;n<settlements.length;n+=1) {
          if (n===from || n===to) continue
          const bounds=settlements[n].bounds
          if (Math.max(p[0],q[0]) >= bounds.minX-12 && Math.min(p[0],q[0]) <= bounds.maxX+12 && Math.max(p[1],q[1]) >= bounds.minZ-12 && Math.min(p[1],q[1]) <= bounds.maxZ+12) cost+=1
        }
      }
      return cost
    }
    const corner = score(corners[0]) <= score(corners[1]) ? corners[0] : corners[1]
    return defineRoad(`link-${from}-${to}`,roundRoadPath([a,corner,b],32),'regional')
  })
}
