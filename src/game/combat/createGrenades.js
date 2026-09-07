import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'

const RADIUS=.12, GRAVITY=9.8, FUSE=2.2
const PROBES=[[0,0,0],[RADIUS,0,0],[-RADIUS,0,0],[0,RADIUS,0],[0,-RADIUS,0],[0,0,RADIUS],[0,0,-RADIUS]]

// 少量球体使用速度积分与碰撞采样，不创建物理世界或刚体。
function simulate(item,dt,world) {
  const p=item.mesh.position
  const steps=Math.max(1,Math.ceil(dt*120),Math.ceil(Math.hypot(item.vx,item.vy,item.vz)*dt/.07))
  const h=dt/steps
  const blocked=(x,y,z)=>{
    for(const [dx,dy,dz] of PROBES) {
      if(world.projectileBlocked(x+dx,y+dy,z+dz,false)) return true
    }
    return false
  }
  for(let step=0;step<steps;step++) {
    item.vy-=GRAVITY*h
    let nx=p.x+item.vx*h,nz=p.z+item.vz*h
    if(blocked(nx,p.y,p.z)) item.vx*=-.42
    else p.x=nx
    if(blocked(p.x,p.y,nz)) item.vz*=-.42
    else p.z=nz
    const ny=p.y+item.vy*h
    if(blocked(p.x,ny,p.z)) {
      item.vy=Math.abs(item.vy)<.5?0:-item.vy*.35
      item.vx*=Math.exp(-5*h);item.vz*=Math.exp(-5*h)
    } else p.y=ny
    const ground=world.terrain.surfaceHeight(p.x,p.z)+RADIUS
    if(p.y<=ground+.008) {
      p.y=ground
      const sx=(world.terrain.surfaceHeight(p.x+.2,p.z)-world.terrain.surfaceHeight(p.x-.2,p.z))/.4
      const sz=(world.terrain.surfaceHeight(p.x,p.z+.2)-world.terrain.surfaceHeight(p.x,p.z-.2))/.4
      const length=Math.hypot(sx,1,sz), ax=-sx/length,ay=1/length,az=-sz/length
      const normalSpeed=item.vx*ax+item.vy*ay+item.vz*az
      if(normalSpeed<-.8) {
        item.vx-=1.32*normalSpeed*ax;item.vy-=1.32*normalSpeed*ay;item.vz-=1.32*normalSpeed*az
        item.vx*=.78;item.vz*=.78
      } else {
        item.vy=0
        const friction=Math.exp(-3.8*h)
        item.vx=(item.vx-GRAVITY*sx/(1+sx*sx+sz*sz)*h)*friction
        item.vz=(item.vz-GRAVITY*sz/(1+sx*sx+sz*sz)*h)*friction
        if(Math.hypot(item.vx,item.vz)<.06 && Math.hypot(sx,sz)<.08) item.vx=item.vz=0
      }
    }
    item.mesh.rotation.x+=item.vz*h/RADIUS
    item.mesh.rotation.z-=item.vx*h/RADIUS
  }
}

export function createGrenades(scene,audio) {
  const active=[],flashes=[]
  const shell=new StandardMaterial('grenade-shell',scene)
  shell.diffuseColor=new Color3(.23,.3,.16)
  const glow=new StandardMaterial('grenade-blast',scene)
  glow.emissiveColor=new Color3(1,.48,.09);glow.alpha=.28;glow.disableLighting=true
  return {
    throw(position,heading,distance) {
      if(active.length>=4) return false
      const mesh=MeshBuilder.CreateSphere('grenade',{diameter:.24,segments:4},scene)
      mesh.material=shell;mesh.isPickable=false
      const lever=MeshBuilder.CreateBox('grenade-lever',{width:.055,height:.05,depth:.2},scene)
      lever.parent=mesh;lever.position.y=.12;lever.material=shell;lever.isPickable=false
      mesh.position.copyFrom(position);mesh.position.y+=1.1
      active.push({mesh,vx:Math.sin(heading)*distance/.85,vz:Math.cos(heading)*distance/.85,vy:2.8,age:0})
      return true
    },
    update(dt,world,spawning) {
      for(let i=flashes.length-1;i>=0;i--) {
        const flash=flashes[i];flash.age+=dt
        if(flash.age>=.3) {flash.mesh.dispose();flashes.splice(i,1);continue}
        flash.mesh.scaling.setAll(.4+flash.age/.3*6.6)
        flash.mesh.visibility=1-flash.age/.3
      }
      for(let i=active.length-1;i>=0;i--) {
        const item=active[i];item.age+=dt
        simulate(item,dt,world)
        const p=item.mesh.position
        if(item.age>=FUSE) {
          spawning.explode(p.x,p.z,7,160)
          audio.play('explosion')
          const flash=MeshBuilder.CreateSphere('blast',{diameter:2,segments:4},scene)
          flash.position.set(p.x,p.y,p.z);flash.material=glow;flash.isPickable=false
          flashes.push({mesh:flash,age:0})
          item.mesh.dispose();active.splice(i,1)
        }
      }
    },
    dispose() {active.forEach(item=>item.mesh.dispose());flashes.forEach(item=>item.mesh.dispose());shell.dispose();glow.dispose()},
  }
}
