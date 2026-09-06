import { buildingCatalog } from '../../assets/buildings/catalog.js'
import { expandAssembly } from '../../assets/environment/catalog.js'
import { createRandom } from '../generation/random.js'
import { compileRoadNetwork, sampleRoad } from '../roads/roadGeometry.js'
import { createCityRoadPlan } from './createCityRoadPlan.js'
import { frontageProfile, addFrontage, blocksRoad, overlapsPlacement, placementBounds } from './frontage.js'

export function createCityPlan(seed, region) {
  const [cx, cz] = region.center, id = `settlement.${region.id}`
  const { profile, roads, gates } = createCityRoadPlan(region, id)
  const blocks = [], placements = [], decorations = [], surfaces = []
  const localRoads = compileRoadNetwork(roads)
  const cuts = profile.cuts
  const families = { residential: ['house', 'townhouse', 'apartments'], commercial: ['corner-store', 'diner', 'townhouse'], civic: ['clinic', 'police'], industrial: ['workshop', 'warehouse'] }
  for (let row = 0; row < cuts.length - 1; row += 1) for (let column = 0; column < cuts.length - 1; column += 1) {
    const blockId = `${id}/block:${row}:${column}`
    const random = createRandom(seed, blockId, 'city-block-v1')
    const kind = row === 0 ? 'industrial' : row === 2 && column === 1 ? 'park' : row === 1 && column === 2 ? 'civic' : row === 1 || row === 2 ? 'commercial' : 'residential'
    const x = (cuts[column] + cuts[column + 1]) / 2, z = (cuts[row] + cuts[row + 1]) / 2
    blocks.push({ id: blockId, kind, bounds: { minX: cx + cuts[column], maxX: cx + cuts[column + 1], minZ: cz + cuts[row], maxZ: cz + cuts[row + 1] } })
    if (kind === 'park') {
      for (const dx of [-12, 12]) for (const dz of [-12, 12]) decorations.push({ id: `${blockId}/tree:${dx}:${dz}`, assetId: 'nature.broadleaf', position: [cx + x + dx, 0, cz + z + dz], rotation: 0, scale: 1 })
      decorations.push(...expandAssembly(`${blockId}/rest`, 'yard.rest-stop', [cx + x, 0, cz + z]))
      continue
    }
    const xs = cuts[column + 1] - cuts[column] >= 60 ? [-12, 12] : [0]
    const zs = cuts[row + 1] - cuts[row] >= 60 ? [-12, 12] : [0]
    for (const dx of xs) for (const dz of zs) {
      const family = families[kind]
      // 每个地块只随机一次；查找期间必须保持目标 ID 不变。
      const modelId = family[Math.floor(random() * family.length)]
      const model = buildingCatalog.find((entry) => entry.id === modelId)
      if (!model) throw new Error(`城市建筑配方缺失：${modelId}（${blockId}）`)
      const anchorX = cx+x+dx, anchorZ = cz+z+dz
      const road = sampleRoad(localRoads,anchorX,anchorZ), segment = road.segment
      const t = Math.max(0,Math.min(1,((anchorX-segment.ax)*segment.dx+(anchorZ-segment.az)*segment.dz)/segment.lengthSquared))
      const roadX=segment.ax+t*segment.dx, roadZ=segment.az+t*segment.dz
      const length=Math.hypot(anchorX-roadX,anchorZ-roadZ)
      if(length<0.01) continue
      const nx=(anchorX-roadX)/length,nz=(anchorZ-roadZ)/length
      const frontage=frontageProfile(model.category)
      const distance=segment.width/2+frontage.verge+frontage.setback+model.depth/2
      const wx=roadX+nx*distance,wz=roadZ+nz*distance,rotation=Math.atan2(-nx,-nz)
      const placement={ id: `${blockId}/lot:${dx}:${dz}`, assetId: model.assetId, position: [wx, 0, wz], rotation, scale: 1, footprint: model.footprint, entrance: model.entrance }
      const bounds=placementBounds(placement)
      if(bounds.x-bounds.hx<cx+cuts[column] || bounds.x+bounds.hx>cx+cuts[column+1] || bounds.z-bounds.hz<cz+cuts[row] || bounds.z+bounds.hz>cz+cuts[row+1]) continue
      if(blocksRoad(placement,localRoads) || placements.some(other=>overlapsPlacement(placement,other,2))) continue
      placements.push(placement)
      addFrontage(surfaces,placement,model,frontage)
    }
    // 街区中心预留院落，避免与四角建筑相叠。
    if (xs.length > 1 && zs.length > 1) decorations.push(...expandAssembly(`${blockId}/yard`, kind === 'industrial' ? 'yard.worksite' : 'yard.rest-stop', [cx + x, 0, cz + z]))
  }
  // 装饰组合也避让新加入的弯道和服务巷道。
  const clearDecorations = decorations.filter((item) => {
    const road = sampleRoad(localRoads, item.position[0], item.position[2])
    return road.distance > road.width / 2 + 3 && !placements.some(building=>overlapsPlacement({ ...item,footprint:{width:6,depth:6} },building,1))
  })
  const extent = profile.span / 2 + 12
  return { id, regionId: region.id, kind: 'city', citySize: region.citySize || 'medium', name: region.name, revision: 2, catalogVersion: 1, streetPlanVersion: 3, frontageVersion: 1, elevation: 0, bounds: { minX: cx - extent, maxX: cx + extent, minZ: cz - extent, maxZ: cz + extent }, gate: gates[0], gates, roads, blocks, placements, surfaces, decorations: clearDecorations }
}
