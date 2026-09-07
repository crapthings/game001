import { useDebugStore } from '../../stores/useDebugStore.js'
import { createWeaponAudio } from '../audio/createWeaponAudio.js'
import '@babylonjs/core/Culling/ray'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { weapons, createCombatState, validCombat } from './weapons.js'
import { useCombatStore } from '../../stores/useCombatStore.js'

export function createCombat(scene, canvas, player, isPlaying, saved) {
  const state = structuredClone(validCombat(saved) ? saved : createCombatState())
  let cursor = null, aim = null, cooldown = 0, reload = 0, feedbackTime = 0, recoil = 0
  const effects = []
  const audio = createWeaponAudio()
  const material = new StandardMaterial('weapon-metal', scene)
  material.diffuseColor = new Color3(.19,.22,.21)
  const gun = MeshBuilder.CreateBox('held-weapon', { width: .12, height: .13, depth: 1 }, scene)
  gun.material = material; gun.parent = player.root
  gun.position.set(.28, 1.05, .38)
  const magazine = MeshBuilder.CreateBox('weapon-magazine', { width: .12, height: .22, depth: .16 }, scene)
  magazine.material = material; magazine.parent = gun; magazine.position.set(0,-.14,-.1)
  const publish = () => useCombatStore.getState().publish({ selected: state.selected, ...state.ammo[state.selected], reloading: reload > 0, request: null })
  const clear = () => { cursor = null; aim = null; audio.stop() }
  const pointer = event => { if (isPlaying()) cursor = { x: event.clientX, y: event.clientY } }
  const facePointer = () => {
    if (!cursor || !isPlaying()) return
    const rect = canvas.getBoundingClientRect()
    const hit = scene.pick(cursor.x-rect.left,cursor.y-rect.top,mesh => mesh.metadata?.ground)
    aim = hit?.hit ? hit.pickedPoint : null
    if (aim && Math.hypot(aim.x-player.root.position.x,aim.z-player.root.position.z) > .2) {
      player.root.rotation.y = Math.atan2(aim.x-player.root.position.x,aim.z-player.root.position.z)
    }
  }
  const key = event => {
    if (event.code !== 'KeyR' || !isPlaying() || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target?.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName)) return
    event.preventDefault()
    if (useDebugStore.getState().infiniteAmmo) return
    const w = weapons[state.selected], ammo = state.ammo[state.selected]
    if (!reload && ammo.loaded < w.magazine && ammo.reserve) { reload = w.reload; audio.play('reload-out'); publish() }
  }
  canvas.addEventListener('pointermove',pointer); canvas.addEventListener('pointerleave',clear)
  window.addEventListener('blur',clear); window.addEventListener('keydown',key)
  publish()
  useCombatStore.getState().publish({accuracy:null,result:null})
  return {
    clear, facePointer,
    snapshot: () => structuredClone(state),
    update(dt, spawning, world, { moving = false, running = false } = {}) {
      gun.setEnabled(isPlaying())
      for (let i=effects.length-1;i>=0;i--) { effects[i].life-=dt; if(effects[i].life<=0) { effects[i].mesh.dispose();effects.splice(i,1) } }
      if (!isPlaying()) { clear(); return }
      feedbackTime=Math.max(0,feedbackTime-dt)
      if(!feedbackTime && useCombatStore.getState().result) useCombatStore.getState().publish({result:null})
      const requested = useCombatStore.getState().request
      if (requested && weapons[requested]) { state.selected=requested;audio.stop();reload=0;cooldown=Math.max(cooldown,.2);publish() }
      const w = weapons[state.selected], ammo = state.ammo[state.selected]
      recoil=Math.max(0,recoil-dt*5)
      gun.position.z=.38-recoil*.12
      gun.rotation.x=-recoil*.15
      gun.scaling.z=w.length
      cooldown=Math.max(0,cooldown-dt)
      const infiniteAmmo=useDebugStore.getState().infiniteAmmo
      if(infiniteAmmo && reload) { reload=0;audio.stop();publish() }
      if(reload>0) { reload=Math.max(0,reload-dt); if(!reload) { const count=Math.min(w.magazine-ammo.loaded,ammo.reserve);ammo.loaded+=count;ammo.reserve-=count;audio.play('reload-in');publish() } }
      if (!infiniteAmmo && !reload && !ammo.loaded && ammo.reserve) { reload=w.reload;audio.play('reload-out');publish() }
      if (!aim || reload || cooldown || (!infiniteAmmo && !ammo.loaded)) return
      const p=player.root.position, heading=player.root.rotation.y
      // 鼠标决定身体方向，仅在前方 ±35° 内寻找可见、无遮挡目标。
      const targets=spawning.targets().map(target => {
        const dx=target.x-p.x,dz=target.z-p.z,distance=Math.hypot(dx,dz)
        const angle=Math.atan2(dx,dz), delta=Math.atan2(Math.sin(angle-heading),Math.cos(angle-heading))
        return {...target,distance,angle,delta}
      }).filter(target=>target.distance<=w.range && Math.abs(target.delta)<=Math.PI*35/180)
        .sort((a,b)=>Math.abs(a.delta)-Math.abs(b.delta)||a.distance-b.distance||a.id.localeCompare(b.id))
      const clearDistance = (dx,dz,range) => {
        for(let t=.2;t<=range;t+=.2) {
          if(!world.isLoaded(p.x+dx*t,p.z+dz*t) || !world.canMove(p.x+dx*t,p.z+dz*t,.05)) return t
        }
        return range
      }
      const target=targets.find(t=>clearDistance(Math.sin(t.angle),Math.cos(t.angle),t.distance)>=t.distance)
      if(!target) return
      const accuracy=Math.max(.2,Math.min(.95,w.accuracy-(target.distance/w.range)*.22-(running ? .3 : moving ? .16 : 0)))
      cooldown=w.interval; if(!infiniteAmmo) ammo.loaded--; publish()
      audio.play(state.selected)
      recoil=w.pellets>1?1:.6
      useCombatStore.getState().publish({accuracy:Math.round(accuracy*100)})
      let result='未命中'
      for(let pellet=0;pellet<w.pellets;pellet++) {
        // 命中率决定是否产生明显瞄准误差；最终仍由射线决定命中谁。
        const accurate=Math.random()<accuracy
        const missAngle=Math.atan2(.7+Math.random()*1.8,Math.max(.5,target.distance))*(Math.random()<.5?-1:1)
        const angle=target.angle+(accurate ? (Math.random()-.5)*w.spread*.4 : missAngle+(Math.random()-.5)*w.spread)
        const dx=Math.sin(angle), dz=Math.cos(angle)
        const headshot=accurate && Math.random()<w.headshot*(running ? .4 : moving ? .65 : 1)
        const hit=spawning.shoot(p.x,p.z,dx,dz,clearDistance(dx,dz,w.range),w.damage*(headshot?2:1),{headshot})
        const distance=hit.distance
        if(hit.hit) result=headshot?'爆头 ×2':result==='爆头 ×2'?result:'命中'
        const line=MeshBuilder.CreateLines('shot-trace',{points:[new Vector3(p.x,p.y+1.1,p.z),new Vector3(p.x+dx*distance,p.y+1.1,p.z+dz*distance)]},scene)
        line.color=headshot && hit.hit ? new Color3(1,.35,.2) : new Color3(1,.8,.35);effects.push({mesh:line,life:.07})
      }
      feedbackTime=.6; useCombatStore.getState().publish({result})
    },
    dispose() {
      clear(); audio.dispose(); gun.dispose();material.dispose();effects.forEach(effect=>effect.mesh.dispose())
      canvas.removeEventListener('pointermove',pointer);canvas.removeEventListener('pointerleave',clear)
      window.removeEventListener('blur',clear);window.removeEventListener('keydown',key)
    },
  }
}
