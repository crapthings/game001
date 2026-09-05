import { buildingCatalog, BUILDING_CATALOG_VERSION } from '../../assets/buildings/catalog.js'
import { createRandom } from '../generation/random.js'

export const TOWN_PLAN_VERSION = 1

// 初版街区：十个地块各使用一种模型；后续城镇生成器可按 category 选取与重复实例化。
export function createTownPlan(seed) {
  const random = createRandom(seed, 'starter-town', TOWN_PLAN_VERSION)
  const models = [...buildingCatalog]
  for (let index = models.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    const previous = models[index]
    models[index] = models[other]
    models[other] = previous
  }
  const placements = models.map((model, index) => {
    const north = index >= 5
    return {
      id: `town.outpost/lot/${index}`, assetId: model.assetId,
      position: [(index % 5 - 2) * 23, 0, north ? 19 : -19],
      rotation: north ? Math.PI : 0, scale: 1,
      footprint: model.footprint, entrance: model.entrance,
    }
  })
  return {
    id: 'town.outpost', name: '灰桥镇', revision: TOWN_PLAN_VERSION, catalogVersion: BUILDING_CATALOG_VERSION,
    bounds: { minX: -68, maxX: 68, minZ: -33, maxZ: 33 }, elevation: 0,
    roads: [{ id: 'main-street', from: [-66, 0], to: [66, 0], width: 9 }],
    placements,
  }
}

export function townSurface(towns, x, z) {
  for (const town of towns) {
    const b = town.bounds
    const outside = Math.max(b.minX - x, x - b.maxX, b.minZ - z, z - b.maxZ, 0)
    if (outside >= 16) continue
    const t = Math.min(1, outside / 16)
    return { town, weight: 1 - t * t * (3 - 2 * t) }
  }
  return null
}
