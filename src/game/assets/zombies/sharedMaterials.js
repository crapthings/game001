import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'

const scenes=new WeakMap()
export function acquireZombieMaterial(scene,color) {
  let cache=scenes.get(scene)
  if(!cache) { cache=new Map();scenes.set(scene,cache) }
  let entry=cache.get(color)
  if(!entry) {
    const material=new StandardMaterial(`zombie-shared:${color}`,scene)
    material.diffuseColor=Color3.FromHexString(color);material.specularColor=Color3.Black()
    entry={material,references:0};cache.set(color,entry)
  }
  entry.references++
  let released=false
  return {material:entry.material,release() {
    if(released) return
    released=true
    if(--entry.references===0) { entry.material.dispose();cache.delete(color) }
    if(!cache.size) scenes.delete(scene)
  }}
}
