import { createRandom } from '../generation/random.js'
import { createTopographySampler } from '../generation/topography.js'
import { createTerrainRouter } from '../roads/createTerrainRouter.js'
import { defineRoad } from '../roads/roadProfiles.js'

const frames = [
  { edge: 'north', forward: [0, -1], right: [-1, 0], yaw: Math.PI },
  { edge: 'east', forward: [-1, 0], right: [0, 1], yaw: -Math.PI / 2 },
  { edge: 'south', forward: [0, 1], right: [1, 0], yaw: 0 },
  { edge: 'west', forward: [1, 0], right: [0, -1], yaw: Math.PI / 2 },
]

export function createOpeningCandidates(seed, topography) {
  const { base } = createTopographySampler(topography)
  const candidates = []
  for (const frame of frames) for (let index = 0; index < 8; index++) {
    const rng = createRandom(seed, 'opening-v1', frame.edge, index)
    const along = Math.round(-840 + (index + 0.2 + rng() * 0.6) * 210)
    const origin = frame.forward.map((value, axis) => -value * 1008 + frame.right[axis] * along)
    const point = (u, v) => origin.map((value, axis) => value + frame.right[axis] * u + frame.forward[axis] * v)
    const cameraPoint = (u, v, height) => { const [x, z] = point(u, v); return [x, height, z] }
    const box = (u0, v0, u1, v1) => {
      const a = point(u0, v0), b = point(u1, v1)
      return { minX: Math.min(a[0], b[0]), maxX: Math.max(a[0], b[0]), minZ: Math.min(a[1], b[1]), maxZ: Math.max(a[1], b[1]) }
    }
    const samples = []
    for (let v = 0; v <= 112; v += 16) for (let u = -32; u <= 32; u += 16) samples.push(base(...point(u, v)))
    const heights = samples.map(sample => sample.height).sort((a, b) => a - b)
    const elevation = heights[Math.floor(heights.length / 2)]
    const relief = heights.at(-1) - heights[0]
    const moisture = samples.reduce((sum, sample) => sum + sample.moisture, 0) / samples.length
    const id = `opening/${frame.edge}/${index}`
    candidates.push({ version: 1, id, templateId: 'roadside-arrival', templateVersion: 2, story: 'out-of-fuel', clearanceVersion: 2,
      edge: frame.edge, origin, yaw: frame.yaw, bounds: box(-48, -8, 48, 120),
      entry: point(0, 8), approachPath: [point(0, 8), point(0, 48), point(0, 88)],
      parking: { position: point(0, 48), yaw: frame.yaw, bounds: box(-12, 38, 12, 58) },
      playerExit: point(6, 48), roadblock: { position: point(0, 60), yaw: frame.yaw, width: 9, depth: 1.2 }, connectionPortal: point(0, 88),
      grading: { core: box(-24, 0, 24, 96), blend: 8, elevation },
      reservations: [{ id: `${id}/clearance`, bounds: box(-48, -8, 48, 120), purposes: ['placement', 'infected', 'camera'] }],
      shots: [{ id: 'arrival', position: cameraPoint(18, 66, 8), target: 'parking' }, { id: 'dialogue', position: cameraPoint(13, 46, 2.2), target: 'playerExit' }],
      preloadBounds: box(-48, -8, 48, 120),
      selection: { candidateCount: 32, relief, moisture, score: relief * 2 + moisture * 15 },
    })
  }
  return candidates.sort((a, b) => a.selection.score - b.selection.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

export function openingObstacle(opening) {
  return { id: opening.id, name: '断油停车点', bounds: opening.bounds, gate: opening.connectionPortal }
}

export function connectOpening(opening, settlements, topography) {
  const nodes = [...settlements, openingObstacle(opening)]
  const router = createTerrainRouter(nodes, topography)
  const choices = settlements.flatMap((town, index) => (town.gates || [town.gate]).map(gate => ({ index, gate,
    distance: Math.hypot(gate[0] - opening.connectionPortal[0], gate[1] - opening.connectionPortal[1]) })))
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
  for (const choice of choices.slice(0, 3)) {
    const result = router.route(settlements.length, choice.index, opening.connectionPortal, choice.gate)
    if (!result) continue
    opening.connection = { settlementId: settlements[choice.index].id, roadId: `${opening.id}/connection`, vehicleValidated: false }
    return [
      defineRoad(`${opening.id}/approach`, opening.approachPath, 'regional', { width: 6, markings: false }),
      defineRoad(opening.connection.roadId, result.points, 'regional', { routing: result.routing }),
    ]
  }
  throw new Error(`开场 ${opening.id} 无可用聚落连接（最多 3 个出入口组合）。`)
}
