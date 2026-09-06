import { roadPoints } from '../roads/roadGeometry.js'
import { biomeCatalog } from './catalog.js'
import { insideRegion } from '../worldConfig.js'
import { ecologyWeights } from '../generation/createHierarchy.js'

const distanceToBounds = (b, x, z) => Math.hypot(Math.max(b.minX - x, 0, x - b.maxX), Math.max(b.minZ - z, 0, z - b.maxZ))
export function regionAt(plan, x, z) {
  return plan.regions.find((region) => insideRegion(region, x, z)) || null
}
export function sampleEcology(plan, x, z) {
  const weights = plan.hierarchy ? ecologyWeights(plan.hierarchy, x, z) : new Map()
  for (const region of plan.hierarchy ? [] : plan.regions) {
    if (!region.bounds) continue
    const distance = distanceToBounds(region.bounds, x, z)
    if (distance > 32) continue
    const regionWeight = Math.max(0.001, 1 - distance / 32)
    let remaining = 1
    for (const patch of region.ecology || []) {
      const influence = Math.max(0, Math.min(0.9, (patch.radius - Math.hypot(x - patch.center[0], z - patch.center[1])) / 24))
      if (!influence) continue
      const contribution = remaining * influence
      weights.set(patch.biome, (weights.get(patch.biome) || 0) + contribution * regionWeight)
      remaining -= contribution
    }
    weights.set(region.biome, (weights.get(region.biome) || 0) + remaining * regionWeight)
  }
  if (!weights.size) weights.set('scrubland', 1)
  const total = [...weights.values()].reduce((sum, value) => sum + value, 0)
  const result = { color: [0, 0, 0], elevation: 0, roughness: 0, density: 0, biome: 'scrubland' }
  let strongest = -1
  for (const [id, raw] of weights) {
    const profile = biomeCatalog[id] || biomeCatalog.scrubland, weight = raw / total
    for (let index = 0; index < 3; index += 1) result.color[index] += profile.color[index] * weight
    result.elevation += profile.elevation * weight
    result.roughness += profile.roughness * weight
    result.density += profile.density * weight
    if (weight > strongest) { strongest = weight; result.biome = id }
  }
  return result
}
export function distanceToRoad(roads, x, z) {
  let nearest = Infinity, width = 5
  for (const road of roads) {
    const points = roadPoints(road)
    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1], to = points[index]
      const dx = to[0] - from[0], dz = to[1] - from[1]
      const lengthSquared = dx * dx + dz * dz
      const t = lengthSquared ? Math.max(0, Math.min(1, ((x - from[0]) * dx + (z - from[1]) * dz) / lengthSquared)) : 0
      const distance = Math.hypot(x - from[0] - t * dx, z - from[1] - t * dz)
      if (distance < nearest) { nearest = distance; width = road.width }
    }
  }
  return { distance: nearest, width }
}
