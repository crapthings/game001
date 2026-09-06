import { sampleRoad } from '../roads/roadGeometry.js'
import { frontageProfile, blocksRoad, overlapsPlacement, placementBounds, addFrontage } from './frontage.js'

export function placeUrbanBuilding({model,anchor,block,segments,placements,surfaces,id,angle=0,setback=0,gap=2}) {
  const [ax,az]=anchor,road=sampleRoad(segments,ax,az),segment=road.segment
  if(!segment || road.distance>24) return null
  const t=Math.max(0,Math.min(1,((ax-segment.ax)*segment.dx+(az-segment.az)*segment.dz)/segment.lengthSquared))
  const rx=segment.ax+t*segment.dx,rz=segment.az+t*segment.dz,length=Math.hypot(ax-rx,az-rz)
  if(length<0.1) return null
  const nx=(ax-rx)/length,nz=(az-rz)/length,rotation=Math.atan2(-nx,-nz)+angle
  const frontage={...frontageProfile(model.category)}
  frontage.setback+=setback
  if(model.id==='fire-station'){frontage.setback=7;frontage.pathWidth=12}
  if(model.id==='hospital'){frontage.setback=5;frontage.pathWidth=6}
  if(model.id==='school'){frontage.setback=5;frontage.pathWidth=4}
  const support=Math.abs(Math.cos(angle))*model.depth/2+Math.abs(Math.sin(angle))*model.width/2
  const distance=segment.width/2+frontage.verge+frontage.setback+support
  const placement={id,blockId:block.id,assetId:model.assetId,position:[rx+nx*distance,0,rz+nz*distance],rotation,scale:1,footprint:model.footprint,entrance:model.entrance}
  const bounds=placementBounds(placement),b=block.bounds
  if(bounds.x-bounds.hx<b.minX+1 || bounds.x+bounds.hx>b.maxX-1 || bounds.z-bounds.hz<b.minZ+1 || bounds.z+bounds.hz>b.maxZ-1) return null
  if(blocksRoad(placement,segments) || placements.some(other=>overlapsPlacement(placement,other,gap)))return null
  placements.push(placement)
  addFrontage(surfaces,placement,model,frontage)
  block.parcels.push({id:`${id}/parcel`,buildingId:id,kind:model.category,entrance:[placement.position[0]+Math.sin(rotation)*model.entrance[2],placement.position[2]+Math.cos(rotation)*model.entrance[2]],bounds:{minX:bounds.x-bounds.hx,maxX:bounds.x+bounds.hx,minZ:bounds.z-bounds.hz,maxZ:bounds.z+bounds.hz}})
  return placement
}
