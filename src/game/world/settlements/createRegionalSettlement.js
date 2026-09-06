import { createCityPlan } from './createCityPlan.js'
import { villageBuildingCatalog } from '../../assets/village/catalog.js'
import { buildingCatalog } from '../../assets/buildings/catalog.js'
import { expandAssembly } from '../../assets/environment/catalog.js'
import { createRandom } from '../generation/random.js'
import { STREET_SCALE } from '../worldMetrics.js'
import { frontageProfile, addFrontage, overlapsPlacement, blocksRoad } from './frontage.js'
import { compileRoadNetwork } from '../roads/roadGeometry.js'

export function createRegionalSettlement(seed, region) {
  if (region.kind === 'city') return createCityPlan(seed, region)
  const [cx, cz] = region.center, id = `settlement.${region.id}`
  const placements = [], decorations = [], surfaces = []
  const width = STREET_SCALE.villageRoadWidth
  const roads = [{ id: `${id}/main-street`, from: [cx-66,cz], to: [cx+66,cz], width }]
  const roadSegments=compileRoadNetwork(roads)
  const models = [...villageBuildingCatalog]
  const random = createRandom(seed, region.id, 'village-layout-v1')
  for (let index=models.length-1;index>0;index-=1) {
    const other=Math.floor(random()*(index+1))
    const current=models[index]
    models[index]=models[other]
    models[other]=current
  }
  let index=0
  for (const side of [-1,1]) {
    // 连续土路肩；端部短于道路，保留末端自然过渡。
    surfaces.push({ kind:'verge',x:cx,z:cz+side*(width/2+0.6),width:118,depth:1.2,rotation:0 })
    for (const xOffset of [-44,-22,0,22,44]) {
      const original=models[index++], lotId=`${id}/lot:${side}:${xOffset}`
      const variation=createRandom(seed,lotId,'village-parcels-v2')
      const useAlternative=original.category==='residential' && variation()<0.7
      const alternativeId=useAlternative?(variation()<0.5?'garden-house':'narrow-house'):null
      const alternative=useAlternative?buildingCatalog.find(item=>item.id===alternativeId):original
      if(!alternative) throw new Error(`村庄住宅配方不存在：${alternativeId}`)
      let model=alternative,profile,placement,x,z,rotation
      for(const candidate of [alternative,original]) {
        model=candidate;profile={...frontageProfile(model.category,true)}
        profile.setback+=variation()*1.2
        const angle=(variation()-0.5)*5*Math.PI/180
        rotation=(side>0?Math.PI:0)+angle
        x=cx+xOffset+(variation()-0.5)*1.2
        const support=Math.abs(Math.cos(angle))*model.depth/2+Math.abs(Math.sin(angle))*model.width/2
        z=cz+side*(width/2+profile.verge+profile.setback+support)
        placement={id:lotId,assetId:model.assetId,position:[x,0,z],rotation,scale:1,footprint:model.footprint,entrance:model.entrance}
        if(!blocksRoad(placement,roadSegments) && !placements.some(other=>overlapsPlacement(placement,other,1)))break
        placement=null
      }
      if(!placement)continue
      placements.push(placement)
      addFrontage(surfaces,placement,model,profile)
      const assembly=model.category==='residential'||model.feature==='grain'?'yard.farm':['industrial','utility'].includes(model.category)?'yard.worksite':'yard.rest-stop'
      decorations.push(...expandAssembly(`${lotId}/rear-yard`,assembly,[x-Math.sin(rotation)*(model.depth/2+6),0,z-Math.cos(rotation)*(model.depth/2+6)],rotation).map(item=>({...item,ownerId:lotId})))
      if(model.category==='residential') {
        // 两段围栏之间留下门前通道，不封住入口。
        for(const dx of [-3.5,3.5]) decorations.push({ id:`${lotId}/front-fence:${dx}`,ownerId:lotId,assetId:'rural.fence',position:[x+dx,0,cz+side*(width/2+profile.verge+0.6)],rotation:0,scale:1 })
      }
    }
  }
  return { id,regionId:region.id,kind:region.kind,name:region.name,revision:1,catalogVersion:1,villageCatalogVersion:1,frontageVersion:1,elevation:0,
    bounds:{minX:cx-72,maxX:cx+72,minZ:cz-44,maxZ:cz+44},parcelPlanVersion:2,gate:[cx-66,cz],gates:[[cx-66,cz],[cx+66,cz]],roads,placements,decorations,surfaces }
}
