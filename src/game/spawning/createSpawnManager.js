import { createHordeNavigation } from './createHordeNavigation.js'
import { createCharacterModel } from '../assets/characters/createCharacterModel.js'
import { isVisible } from '../map/visibility.js'
import { getSpawnPlan, buildingBlocksSegment } from './createSpawnPlan.js'
import { useWorldStore } from '../../stores/useWorldStore.js'
import { createHitEffects } from '../combat/createHitEffects.js'
import { openingContains } from '../world/opening/openingGeometry.js'
import { createRandom } from '../world/generation/random.js'
import { zombieDefinitions } from '../assets/zombies/catalog.js'

export const SPAWN_LIMITS = Object.freeze({ prepare:48,chase:60,unload:80,active:96 })

export function createSpawnManager(scene, plan, world) {
  const points=getSpawnPlan(plan).points, buildings=plan.settlements.flatMap(town=>town.placements)
  const active=new Map(), blocked=new Set()
  const effects = createHitEffects(scene,world.terrain)
  const navigation=createHordeNavigation(world)
  const health = new Map(), pendingKills = new Set(), saving = new Set()
  const random=createRandom(plan.seed,'horde-director-v1')
  let hordeSerial=0, hordeTimer=0, aiTimer=0, shake=0
  let retryTimer = 0
  let stats={active:0,visible:0,planned:points.length,deferred:0}
  const install = point => {
    const model=createCharacterModel(scene,point.assetId)
    model.root.setEnabled(false)
    model.root.position.set(point.x,world.terrain.surfaceHeight(point.x,point.z),point.z)
    model.root.rotation.y=point.rotation
    const height=zombieDefinitions.find(definition=>`character.zombie.${definition.id}`===point.assetId)?.height || 1.8
    const behavior=createRandom(plan.seed,point.id,'chase-style')
    active.set(point.id,{speed:model.locomotion.speed*(.94+behavior()*.12),stop:.7+behavior()*.4,bias:behavior()*2-1,point:{...point},model,meshes:model.root.getChildMeshes(),fade:0,height,hitTime:0,alert:point.transient?8:0,moving:false})
  }
  const release = id => {
    const entry=active.get(id)
    if(!entry) return
    entry.model.dispose()
    entry.meshes.length=0
    active.delete(id)
    health.delete(id)
  }
  return {
    consumeShake() { const value=shake;shake=0;return value },
    targets: () => [...active.values()].filter(entry => !pendingKills.has(entry.point.id) && entry.model.root.isEnabled()).map(entry => ({ id: entry.point.id, x: entry.point.x, z: entry.point.z })),
    shoot(x,z,dx,dz,range,damage,{headshot=false}={}) {
      let closest=null, distance=range
      for(const entry of active.values()) {
        if(pendingKills.has(entry.point.id) || !entry.model.root.isEnabled()) continue
        const ox=entry.point.x-x, oz=entry.point.z-z, along=ox*dx+oz*dz
        const perpendicular=Math.abs(ox*dz-oz*dx)
        if(perpendicular>.5) continue
        const hit=Math.max(0,along-Math.sqrt(.25-perpendicular*perpendicular))
        if(along>0 && hit<distance) { distance=hit;closest=entry }
      }
      if(closest) {
        const id=closest.point.id, remaining=(health.get(id) ?? 100)-damage
        health.set(id,remaining)
        const p=closest.model.root.position
        effects.burst(p.x,p.y+closest.height*(headshot ? .88 : .55),p.z,dx,dz,{headshot,killed:remaining<=0})
        closest.hitTime=headshot ? .22 : .12
        if(remaining<=0) { if(!closest.point.transient) pendingKills.add(id);if(headshot) shake=1;release(id) }
      }
      return { distance, hit: Boolean(closest) }
    },
    update(dt,position,heading,vision,progress,{initial=false,paused=false}={}) {
      effects.update(dt)
      if(!initial) navigation.update(dt,position)
      const dead=new Set(progress.killedZombieIds || [])
      retryTimer = Math.max(0,retryTimer-dt)
      for(const id of pendingKills) {
        if(dead.has(id)) { pendingKills.delete(id);continue }
        dead.add(id)
        if(!saving.has(id) && !retryTimer) {
          saving.add(id)
          useWorldStore.getState().dispatch({type:'zombie-killed',id}).then(saved=>{ if(!saved) retryTimer=2 }).finally(()=>saving.delete(id))
        }
      }
      const range=point=>Math.hypot(point.x-position.x,point.z-position.z)
      const visible=point=>isVisible(point.x-position.x,point.z-position.z,heading,vision) && !buildings.some(b=>buildingBlocksSegment(b,[position.x,position.z],[point.x,point.z]))
      for (const [id,entry] of active) {
        if (dead.has(id) || range(entry.point)>SPAWN_LIMITS.unload || !world.isLoaded(entry.point.x,entry.point.z)) release(id)
      }
      const candidates=points.filter(p=>range(p)<=SPAWN_LIMITS.prepare && !dead.has(p.id) && !blocked.has(p.id) && !active.has(p.id)).sort((a,b)=>range(a)-range(b)||a.id.localeCompare(b.id))
      let pending=0,deferred=0,created=0
      for (const point of candidates) {
        if (!world.isLoaded(point.x,point.z)) continue
        if (!world.canMove(point.x,point.z,0.8)) { blocked.add(point.id);continue }
        // 正常游玩时，错过预热的可见点必须延迟，不能补刷到眼前。
        if (!initial && visible(point)) { deferred++;continue }
        if (active.size>=SPAWN_LIMITS.active) {
          const farthest=[...active.values()].filter(e=>!visible(e.point)&&range(e.point)>SPAWN_LIMITS.prepare).sort((a,b)=>range(b.point)-range(a.point))[0]
          if (farthest) release(farthest.point.id)
          else continue
        }
        if (paused) continue
        if (created>=2) { pending++;continue }
        install(point)
        created++
      }
      // 运行时尸群补充在视野外，不修改世界出生点或持久化临时敌人。
      hordeTimer=Math.max(0,hordeTimer-dt)
      if(!initial && !paused && !hordeTimer && active.size<SPAWN_LIMITS.active && !openingContains(plan.opening,position.x,position.z,4)) {
        hordeTimer=.35
        let added=0
        for(let attempt=0;attempt<16 && added<2 && active.size<SPAWN_LIMITS.active;attempt++) {
          const angle=random()*Math.PI*2, radius=Math.max(28,vision.radius+6)+random()*14
          const x=position.x+Math.sin(angle)*radius,z=position.z+Math.cos(angle)*radius
          const point={id:`horde/${hordeSerial}`,assetId:'character.zombie.wanderer',x,z,rotation:angle+Math.PI,transient:true}
          if(visible(point) || openingContains(plan.opening,x,z,4) || !world.isLoaded(x,z) || !world.canMove(x,z,.6) || [...active.values()].some(e=>Math.hypot(e.point.x-x,e.point.z-z)<1.4)) continue
          hordeSerial++;install(point);added++
        }
      }
      aiTimer+=dt
      const aiStep=aiTimer>=.1?Math.min(aiTimer,.15):0
      if(aiStep) aiTimer=0
      let visibleCount=0
      for (const entry of active.values()) {
        entry.hitTime=Math.max(0,entry.hitTime-dt)
        entry.model.root.rotation.z=Math.sin(entry.hitTime*55)*entry.hitTime*.7
        const seesPlayer=!initial && visible(entry.point)
        const withinChase=range(entry.point)<=SPAWN_LIMITS.chase
        entry.alert=withinChase ? ((seesPlayer || entry.point.transient)?8:Math.max(0,entry.alert-dt)) : 0
        if(!entry.alert) entry.moving=false
        if(aiStep && entry.alert>0 && !initial) {
          const p=entry.point, dx=position.x-p.x,dz=position.z-p.z,distance=Math.hypot(dx,dz)
          entry.moving=false
          if(distance>entry.stop) {
            const route=navigation.direction(p.x,p.z,position,entry.bias)
            let vx=route?.x ?? 0,vz=route?.z ?? 0
            for(const other of active.values()) {
              if(other===entry) continue
              const ox=p.x-other.point.x,oz=p.z-other.point.z,d=Math.hypot(ox,oz)
              if(d>0 && d<1.2) { vx+=ox/d*(1.2-d)*1.5;vz+=oz/d*(1.2-d)*1.5 }
            }
            const norm=Math.hypot(vx,vz)||1, step=Math.min(distance-entry.stop,entry.speed*aiStep)
            const mx=vx/norm*step,mz=vz/norm*step, oldX=p.x,oldZ=p.z
            const allowed=(x,z)=>world.canMove(x,z,.42)
            if(allowed(p.x+mx,p.z+mz)) { p.x+=mx;p.z+=mz }
            else if(allowed(p.x+mx,p.z)) p.x+=mx
            else if(allowed(p.x,p.z+mz)) p.z+=mz
            entry.moving=Math.hypot(p.x-oldX,p.z-oldZ)>.001


          }
        }
        const visual=entry.model.root.position, blend=1-Math.exp(-dt*24)
        const previousX=visual.x,previousZ=visual.z
        visual.x+=(entry.point.x-visual.x)*blend;visual.z+=(entry.point.z-visual.z)*blend
        visual.y=world.terrain.surfaceHeight(visual.x,visual.z)
        const travelled=Math.hypot(visual.x-previousX,visual.z-previousZ)
        const stepping=dt>0 && travelled/dt>.025
        if(stepping) {
          const desired=Math.atan2(visual.x-previousX,visual.z-previousZ)
          const current=entry.model.root.rotation.y
          entry.model.root.rotation.y=current+Math.atan2(Math.sin(desired-current),Math.cos(desired-current))*(1-Math.exp(-dt*16))
        }
        const show=!initial && visible(entry.point)
        entry.model.root.setEnabled(show)
        if (show) {
          visibleCount++;entry.fade=Math.min(1,entry.fade+dt*6)
          for (const mesh of entry.meshes) mesh.visibility=entry.fade
          entry.model.update(dt,stepping,entry.model.root.position.y,false,travelled)
        } else entry.fade=0
      }
      stats={active:active.size,visible:visibleCount,planned:points.length,deferred}
      return { ready:pending===0, ...stats }
    },
    getStats:()=>stats,
    dispose() { for (const id of active.keys()) release(id);blocked.clear();health.clear();pendingKills.clear();saving.clear();navigation.dispose();effects.dispose() },
  }
}
