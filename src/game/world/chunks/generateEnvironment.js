import { createRandom } from '../generation/random.js'
import { sampleEnvironment } from '../biomes/environmentField.js'
import { environmentCatalog } from '../../assets/environment/catalog.js'
import { openingBlocksPlacement, naturalShape } from '../opening/openingGeometry.js'
import { townSurface } from '../settlements/createTownPlan.js'

// 每个格点有一个候选，偏移限制在格点中心附近：相邻 Chunk 的候选也保持间距。
export function generateEnvironment(terrain, cx, cz) {
  const placements = []
  for (const layer of [{ id: 'canopy', count: 5 }, { id: 'cover', count: 8 }]) {
    const spacing = 32 / layer.count
    for (let row = 0; row < layer.count; row++) for (let col = 0; col < layer.count; col++) {
      const gx = cx * layer.count + col, gz = cz * layer.count + row
      const random = createRandom(terrain.seed, 'environment-v2', layer.id, gx, gz)
      const x = (gx + 0.5 + (random() - 0.5) * 0.4) * spacing
      const z = (gz + 0.5 + (random() - 0.5) * 0.4) * spacing
      if (townSurface(terrain.settlements, x, z)?.weight > 0.1) continue
      const road = terrain.nearbyRoad(x, z), field = sampleEnvironment(terrain, x, z, road)
      const canopy = layer.id === 'canopy'
      if (random() > (canopy ? field.treeDensity : field.coverDensity)) continue
      const choice = random()
      let assetId
      if (canopy) assetId = field.biome === 'wetland' ? 'nature.dead-tree' : choice < 0.45 ? 'nature.birch' : choice < 0.8 ? 'nature.young-pine' : 'nature.broadleaf'
      else if (field.edge < 2.5) assetId = choice < 0.55 ? 'nature.gravel-patch' : 'nature.dry-grass'
      else if (field.biome === 'quarry') assetId = choice < 0.4 ? 'nature.mossy-boulder' : 'nature.gravel-patch'
      else if (field.biome === 'wetland') assetId = choice < 0.65 ? 'nature.reeds' : 'nature.fern-clump'
      else if (field.grove > 0.52) assetId = choice < 0.55 ? 'nature.fern-clump' : choice < 0.8 ? 'nature.thorn-bush' : 'nature.mossy-boulder'
      else assetId = choice < 0.7 ? 'nature.dry-grass' : choice < 0.9 ? 'nature.flowers' : 'nature.gravel-patch'
      let gravelScale = null
      if (assetId === 'nature.gravel-patch') {
        const variation = createRandom(terrain.seed, 'gravel-distribution-v2', gx, gz)
        // 连续斑块控制出现概率；减少每个候选格都有一小堆石子的铺满感。
        const patch = Math.max(0, Math.min(1, .45 + terrain.noise(x, z, 29, 'gravel-patches-v2') * .8))
        if (variation() > .12 + patch * .7) continue
        const variants = ['', ':sparse', ':trail', ':broken', ':compact', ':scattered']
        assetId += variants[Math.floor(variation() * variants.length)]
        gravelScale = .55 + variation() * .85
      }
      const definition = environmentCatalog[assetId], scale = gravelScale ?? (canopy ? 0.85 + random() * 0.45 : 0.7 + random() * 0.4)
      const extent = naturalShape(definition).radius * scale
      if (field.edge < extent + (canopy ? 2 : 0.25)) continue
      const y = terrain.surfaceHeight(x, z)
      const slope = Math.hypot(terrain.height(x + 1, z) - terrain.height(x - 1, z), terrain.height(x, z + 1) - terrain.height(x, z - 1)) / 2
      if (slope > (canopy ? 0.5 : 0.7)) continue
      const placement = { id: `environment-v2/${layer.id}/${gx}/${gz}`, assetId, position: [x, y, z], rotation: random() * Math.PI * 2, scale }
      if (!openingBlocksPlacement(terrain.plan.opening, placement, definition)) placements.push(placement)
    }
  }
  return placements
}
