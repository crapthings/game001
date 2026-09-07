import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'

export function createTracerPool(scene) {
  const pool=Array.from({length:24},(_,i)=>{
    const points=[Vector3.Zero(),new Vector3(0,0,1)]
    const mesh=MeshBuilder.CreateLines(`shot-trace:${i}`,{points,updatable:true},scene)
    mesh.isPickable=false;mesh.setEnabled(false)
    return {mesh,points,life:0}
  })
  let cursor=0
  return {
    emit(x,y,z,endX,endZ,headshot) {
      const item=pool[cursor++%pool.length]
      item.points[0].set(x,y,z);item.points[1].set(endX,y,endZ)
      MeshBuilder.CreateLines('shot-trace',{points:item.points,instance:item.mesh},scene)
      item.mesh.color.set(1,headshot ? .35 : .8,headshot ? .2 : .35)
      item.life=.07;item.mesh.setEnabled(true)
    },
    update(dt) {
      for(const item of pool) if(item.life>0) {
        item.life-=dt
        if(item.life<=0) item.mesh.setEnabled(false)
      }
    },
    dispose() { pool.forEach(item=>item.mesh.dispose()) },
  }
}
