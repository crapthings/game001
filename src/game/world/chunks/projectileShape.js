import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector'

const cache=new WeakMap()
// 视觉配方生成轻量实体代理；叶片、苔藓等装饰不充当防弹实体。
export function projectileShape(definition,assetId=definition?.assetId || '') {
  if(!definition) return null
  if(cache.has(definition)) return cache.get(definition)
  const id=assetId
  const soft=definition.tags?.some(tag=>['groundcover','shrub'].includes(tag)) || /nature\.(reeds|flowers|bush)(:|$)/.test(id)
  let parts=soft?[]:definition.parts || []
  if(definition.projectileParts) parts=definition.projectileParts.map(index=>definition.parts[index])
  else if(definition.tags?.includes('tree') || /nature\.(broadleaf|dead-tree)$/.test(id)) parts=parts.filter(part=>part.shape==='cylinder').slice(0,1)
  const shapes=parts.map(part=>{
    const [rx,ry,rz]=part.rotation || [0,0,0]
    const inverse=Matrix.RotationYawPitchRoll(ry,rx,rz).invert()
    return {part,inverse}
  })
  const radius=parts.reduce((max,part)=>Math.max(max,Math.hypot(part.position[0],part.position[2])+Math.hypot(...part.size)),0)
  const local=new Vector3(),rotated=new Vector3()
  const result={radius,contains(x,y,z) {
    for(const {part,inverse} of shapes) {
      local.set(x-part.position[0],y-part.position[1],z-part.position[2])
      Vector3.TransformCoordinatesToRef(local,inverse,rotated)
      const [w,h,d]=part.size
      if(part.shape==='sphere') {
        if((rotated.x/(w/2))**2+(rotated.y/(h/2))**2+(rotated.z/(d/2))**2<=1) return true
      } else if(part.shape==='cylinder') {
        if(Math.abs(rotated.y)>h/2) continue
        const t=(rotated.y+h/2)/h,r=(w+(d-w)*t)/2
        if(rotated.x**2+rotated.z**2<=r*r) return true
      } else if(Math.abs(rotated.x)<=w/2 && Math.abs(rotated.y)<=h/2 && Math.abs(rotated.z)<=d/2) return true
    }
    return false
  }}
  cache.set(definition,result);return result
}
