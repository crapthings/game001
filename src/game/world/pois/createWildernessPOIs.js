import { createRandom } from '../generation/random.js'
import { createTopographySampler } from '../generation/topography.js'
import { sampleEcology } from '../biomes/sampleEcology.js'
import { roadPoints, compileRoadNetwork, sampleRoad } from '../roads/roadGeometry.js'
import { defineRoad } from '../roads/roadProfiles.js'
import { overlapsBounds } from '../opening/openingGeometry.js'
import { buildingCatalog } from '../../assets/buildings/catalog.js'
import { villageBuildingCatalog } from '../../assets/village/catalog.js'
import { expandAssembly } from '../../assets/environment/catalog.js'

const recipes = [
  { id: 'fuel', name: '废弃加油站', asset: 'building.gas-station', yard: 'yard.worksite', roadside: true },
  { id: 'repair', name: '路边维修站', asset: 'building.workshop', yard: 'yard.worksite', roadside: true },
  { id: 'cabin', name: '护林小屋', asset: 'building.village.plaster-home', yard: 'yard.rest-stop', biomes: ['woodland', 'scrubland'] },
  { id: 'camp', name: '废弃营地', biomes: ['woodland', 'meadow'] },
  { id: 'farm', name: '独立农舍', asset: 'building.village.farmhouse', yard: 'yard.farm', biomes: ['farmland', 'meadow'] },
  { id: 'pump', name: '野外泵站', asset: 'building.village.pump-house', yard: 'yard.worksite', biomes: ['wetland', 'meadow'] },
]

// 有限候选、稳定顺序；不满足约束的地点跳过，不强行填满配额。
export function createWildernessPOIs(seed, regions, hierarchy, topography, opening, settlements, roads) {
  const { sample } = createTopographySampler(topography)
  const segments = roads.flatMap(road => roadPoints(road).slice(1).map((to, i) => ({ from: roadPoints(road)[i], to })))
  const sites = [], connections = [], skipped = []
  const roadNetwork = compileRoadNetwork(roads)
  const definitions = [...buildingCatalog, ...villageBuildingCatalog]
  for (let round = 0; round < 2; round++) for (const recipe of recipes) {
    const id = `poi-v1/${recipe.id}/${round}`, random = createRandom(seed, id)
    let best = null
    for (let attempt = 0; attempt < 96 && segments.length; attempt++) {
      const segment = segments[Math.floor(random() * segments.length)]
      const t = .15 + random() * .7
      const anchor = segment.from.map((v, i) => v + (segment.to[i] - v) * t)
      const dx = segment.to[0] - segment.from[0], dz = segment.to[1] - segment.from[1], length = Math.hypot(dx, dz)
      if (length < 1) continue
      const offset = (recipe.roadside ? 38 + random() * 22 : 70 + random() * 90) * (random() < .5 ? -1 : 1)
      const x = Math.round(anchor[0] - dz / length * offset), z = Math.round(anchor[1] + dx / length * offset)
      const bounds = { minX: x - 24, maxX: x + 24, minZ: z - 24, maxZ: z + 24 }
      const region = regions.find(r => bounds.minX > r.bounds.minX + 24 && bounds.maxX < r.bounds.maxX - 24 && bounds.minZ > r.bounds.minZ + 24 && bounds.maxZ < r.bounds.maxZ - 24)
      if (!region || overlapsBounds(bounds, opening.bounds, 80)) continue
      const macroId = region.parentId
      if (sites.filter(site => site.macroId === macroId).length >= 3) continue
      const nearby = sampleRoad(roadNetwork, x, z)
      if (nearby.distance < 35 + nearby.width / 2) continue
      if ([...settlements, ...sites].some(site => overlapsBounds(bounds, site.bounds, 100))) continue
      if (sites.some(site => site.poiType === recipe.id && Math.hypot(x - site.center[0], z - site.center[1]) < 600)) continue
      const biome = sampleEcology({ regions, hierarchy }, x, z).biome
      if (recipe.biomes && !recipe.biomes.includes(biome)) continue
      const samples = [-20, 0, 20].flatMap(oz => [-20, 0, 20].map(ox => sample(x + ox, z + oz)))
      const relief = Math.max(...samples.map(p => p.height)) - Math.min(...samples.map(p => p.height))
      if (relief > 3 || samples.some(p => p.slope > 8 || p.moisture > .78)) continue
      // 支路仅接当前公路，沿线避开开场和其他地点，并拒绝陡坡。
      let blocked = false
      for (let step = 0; step <= 24; step++) {
        const u = step / 24, px = anchor[0] + (x - anchor[0]) * u, pz = anchor[1] + (z - anchor[1]) * u
        const b = { minX: px - 3, maxX: px + 3, minZ: pz - 3, maxZ: pz + 3 }
        if (sample(px, pz).slope > 12 || overlapsBounds(b, opening.bounds, 24) || [...settlements, ...sites].some(site => overlapsBounds(b, site.bounds, 20))) { blocked = true; break }
      }
      if (blocked) continue
      const separation = sites.length ? Math.min(...sites.map(site => Math.hypot(x - site.center[0], z - site.center[1]))) : 0
      const score = -relief + Math.min(separation, 800) / 200 + random() * .4
      if (!best || score > best.score) best = { x, z, anchor, bounds, region, elevation: sample(x, z).height, score }
    }
    if (!best) { skipped.push(id); continue }
    const { x, z, anchor, bounds, region, elevation } = best
    const yaw = Math.atan2(anchor[0] - x, anchor[1] - z)
    const local = (u, v) => [x + Math.cos(yaw) * u + Math.sin(yaw) * v, 0, z - Math.sin(yaw) * u + Math.cos(yaw) * v]
    const placements = [], decorations = []
    if (recipe.asset) {
      const model = definitions.find(item => item.assetId === recipe.asset)
      placements.push({ id: `${id}/building`, assetId: model.assetId, position: local(0, -6), rotation: yaw, scale: 1, footprint: model.footprint, entrance: model.entrance })
      decorations.push(...expandAssembly(`${id}/yard`, recipe.yard, local(-14, -6), yaw))
    } else {
      for (const [index, [assetId, u, v]] of [['prop.tent', -7, -4], ['prop.tent', 6, -7], ['prop.cold-campfire', 0, 2], ['prop.water-can', -4, 0]].entries()) {
        decorations.push({ id: `${id}/camp/${index}`, assetId, position: local(u, v), rotation: yaw, scale: 1 })
      }
    }
    const gate = local(0, 22), end = local(0, 12)
    connections.push(defineRoad(`${id}/access`, [anchor, [gate[0], gate[2]], [end[0], end[2]]], 'service', { width: recipe.roadside ? 4 : 2.5 }))
    roadNetwork.push(...compileRoadNetwork([connections.at(-1)]))
    sites.push({ id, poiType: recipe.id, center: [x, z], regionId: region.id, macroId: region.parentId, kind: 'poi', name: `${recipe.name} ${round + 1}`, revision: 1, catalogVersion: 1,
      bounds, elevation, terrainBlend: 24, gate: [gate[0], gate[2]], roads: [], placements, decorations, surfaces: [] })
  }
  return { sites, connections, skipped, version: 1, targetCount: 12 }
}
