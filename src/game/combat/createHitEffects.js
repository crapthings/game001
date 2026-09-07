import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import '@babylonjs/core/Meshes/instancedMesh'

// 固定池、共享几何与材质；无逐次创建 Mesh，无物理刚体。
export function createHitEffects(scene, terrain) {
  const material = new StandardMaterial('infected-fragments',scene)
  material.diffuseColor = new Color3(.38,.14,.09)
  material.emissiveColor = new Color3(.07,.015,.005)
  const source=MeshBuilder.CreateBox('fragment-source',{size:1},scene)
  source.material=material;source.isVisible=false;source.isPickable=false
  const pool=Array.from({length:96},(_,i)=>{
    const mesh=source.createInstance(`fragment-${i}`)
    mesh.isVisible=true;mesh.isPickable=false;mesh.setEnabled(false)
    return {mesh,life:0,total:1,vx:0,vy:0,vz:0,ground:0,size:.1}
  })
  let cursor=0
  return {
    burst(x,y,z,dx,dz,{headshot=false,killed=false}={}) {
      const count=killed?(headshot?22:16):headshot?10:4
      for(let i=0;i<count;i++) {
        const item=pool[cursor++%pool.length], speed=killed?3:1.5
        item.size=(killed ? .09 : .035)+Math.random()*(killed ? .18 : .07)
        item.total=item.life=killed?1.1+Math.random()*.5:.25+Math.random()*.2
        item.vx=dx*speed+(Math.random()-.5)*speed*2
        item.vz=dz*speed+(Math.random()-.5)*speed*2
        item.vy=1+Math.random()*(headshot?4:2.5)
        item.ground=terrain.surfaceHeight(x,z)+.03
        item.mesh.position.set(x,y,z);item.mesh.rotation.set(Math.random()*3,Math.random()*3,0)
        item.mesh.scaling.set(item.size,item.size*.65,item.size*.8);item.mesh.setEnabled(true)
      }
    },
    update(dt) {
      for(const item of pool) {
        if(item.life<=0) continue
        item.life-=dt
        if(item.life<=0) { item.mesh.setEnabled(false);continue }
        const p=item.mesh.position
        item.vy-=9.8*dt;p.x+=item.vx*dt;p.z+=item.vz*dt;p.y+=item.vy*dt
        if(p.y<item.ground) { p.y=item.ground;item.vy=Math.abs(item.vy)*.2;item.vx*=.7;item.vz*=.7 }
        item.mesh.rotation.x+=dt*4;item.mesh.rotation.z+=dt*3
        const size=item.size*Math.min(1,item.life/.25)
        item.mesh.scaling.set(size,size*.65,size*.8)
      }
    },
    dispose() { pool.forEach(item=>item.mesh.dispose());source.dispose();material.dispose() },
  }
}
