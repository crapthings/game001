import { openingContains } from '../world/opening/openingGeometry.js'
import { createRandom } from '../world/generation/random.js'
import { zombieCatalog } from '../assets/zombies/catalog.js'
import { compileRoadNetwork, sampleRoad } from '../world/roads/roadGeometry.js'

const cached = new WeakMap()
export function buildingBlocksSegment(building, a, b, padding = 0) {
  const cosine = Math.cos(building.rotation), sine = Math.sin(building.rotation)
  const local = p => {
    const x = p[0] - building.position[0], z = p[1] - building.position[2]
    return [x*cosine-z*sine,x*sine+z*cosine]
  }
  const from = local(a), to = local(b)
  const half = [building.footprint.width * building.scale/2+padding,building.footprint.depth * building.scale/2+padding]
  let enter = 0, leave = 1
  for (let axis=0;axis<2;axis++) {
    const delta=to[axis]-from[axis]
    if (Math.abs(delta)<1e-8) { if (Math.abs(from[axis])>half[axis]) return false }
    else {
      const first=(-half[axis]-from[axis])/delta, second=(half[axis]-from[axis])/delta
      enter=Math.max(enter,Math.min(first,second));leave=Math.min(leave,Math.max(first,second))
    }
  }
  return enter<=leave
}

export function createSpawnPlan(world) {
  const points = [], buildings = world.settlements.flatMap(town=>town.placements)
  const roads = compileRoadNetwork(world.roads || [])
  const inTown = (x,z) => world.settlements.find(town=>x>town.bounds.minX-24 && x<town.bounds.maxX+24 && z>town.bounds.minZ-24 && z<town.bounds.maxZ+24)
  const special = { hospital:'medic',school:'wanderer','fire-station':'firefighter',police:'riot',warehouse:'worker',factory:'hazmat' }
  for (let z=-32;z<32;z++) for (let x=-32;x<32;x++) {
    const random = createRandom(world.seed,'infection-v2',x,z)
    const cx=x*32+6+random()*20, cz=z*32+6+random()*20
    const town=inTown(cx,cz)
    const roadside=!town && sampleRoad(roads,cx,cz).distance<28
    const region=world.regions.find(r=>cx>=r.bounds.minX && cx<r.bounds.maxX && cz>=r.bounds.minZ && cz<r.bounds.maxZ)
    const chance=town?.kind==='city'?0.85:town?0.7:roadside?0.62:0.22
    if (random()>chance) continue
    const count=town?.kind==='city'?2:1+Number(random()<.25)
    for (let index=0;index<count;index++) {
      if (points.length >= 4096) break
      const px=cx+(random()-0.5)*12,pz=cz+(random()-0.5)*12
      if (openingContains(world.opening, px, pz, 12) || Math.hypot(px-world.spawn[0],pz-world.spawn[1])<40 || points.some(point=>Math.hypot(point.x-px,point.z-pz)<2.2) || buildings.some(b=>buildingBlocksSegment(b,[px,pz],[px,pz],1))) continue
      const zone=town?.kind==='city'?'city':town?'village':roadside?'roadside':region?.biome==='wetland'?'wetland':'forest'
      const pool=zombieCatalog.filter(item=>item.zones.includes(zone))
      let assetId=random()<0.65?'character.zombie.wanderer':pool[Math.floor(random()*pool.length)].assetId
      const nearby=buildings.find(b=>Math.hypot(b.position[0]-px,b.position[2]-pz)<24 && Object.keys(special).some(key=>b.assetId.endsWith(key)))
      if (nearby && random()<0.6) assetId=`character.zombie.${special[Object.keys(special).find(key=>nearby.assetId.endsWith(key))]}`
      points.push({ id:`infected-v2/${x}/${z}/${index}`,assetId,x:px,z:pz,rotation:random()*Math.PI*2,regionId:region.id })
    }
  }
  return { version:2,points }
}

// 旧快照保留原出生 ID 和已击杀记录，补充新版候选；不原地修改存档。
export function getSpawnPlan(world) {
  if (world.spawnPlan?.version === 2) return world.spawnPlan
  if (!cached.has(world)) {
    const legacy = world.spawnPlan?.points || []
    const next = createSpawnPlan(world)
    const points = [...legacy]
    for (const point of next.points) {
      if (points.length >= 4096) break
      if (!points.some(other => Math.hypot(other.x-point.x,other.z-point.z)<2.2)) points.push(point)
    }
    cached.set(world,{version:2,points})
  }
  return cached.get(world)
}
