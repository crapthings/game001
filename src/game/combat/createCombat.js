import crosshairUrl from '../../ui/cursors/crosshair.svg?url'
import { createGrenades } from './createGrenades.js'
import { screenDirection } from '../core/screenDirection.js'
import { useDebugStore } from '../../stores/useDebugStore.js'
import { createWeaponAudio } from '../audio/createWeaponAudio.js'
import '@babylonjs/core/Culling/ray'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { createTracerPool } from './createTracerPool.js'
import { weapons, createCombatState, validCombat } from './weapons.js'
import { useCombatStore } from '../../stores/useCombatStore.js'

export function createCombat(scene, canvas, player, isPlaying, saved) {
  const state = structuredClone(validCombat(saved) ? saved : createCombatState())
  state.grenades ??= 3
  let grenadeRequested=false, throwCooldown=0, aimDistance=12
  let cursor = null, aim = null, cooldown = 0, reload = 0, feedbackTime = 0, recoil = 0
  const tracers = createTracerPool(scene)
  const audio = createWeaponAudio()
  const grenades=createGrenades(scene,audio)
  const previousCursor=canvas.style.cursor
  const previousCursorHandling=scene.doNotHandleCursors
  scene.doNotHandleCursors=true
  let cursorPlaying=null
  const aimingCursor=`url("${crosshairUrl}") 16 16, crosshair`
  const material = new StandardMaterial('weapon-metal', scene)
  material.diffuseColor = new Color3(.19,.22,.21)
  const gun = MeshBuilder.CreateBox('held-weapon', { width: .12, height: .13, depth: 1 }, scene)
  gun.material = material; gun.parent = player.root
  gun.position.set(.28, 1.05, .38)
  const magazine = MeshBuilder.CreateBox('weapon-magazine', { width: .12, height: .22, depth: .16 }, scene)
  magazine.material = material; magazine.parent = gun; magazine.position.set(0,-.14,-.1)
  const publish = () => useCombatStore.getState().publish({ grenades: state.grenades, selected: state.selected, ...state.ammo[state.selected], reloading: reload > 0, request: null })
  const clear = () => { cursor = null; aim = null; grenadeRequested=false; audio.stop() }
  const pointer = event => { if (isPlaying()) cursor = { x: event.clientX, y: event.clientY } }
  const facePointer = () => {
    if (!cursor || !isPlaying()) return
    const rect = canvas.getBoundingClientRect()
    // 相机始终跟随角色躯干；使用无震屏偏移的屏幕中心作为瞄准原点。
    const horizontal=cursor.x-rect.left-rect.width/2, up=rect.height/2-(cursor.y-rect.top)
    if(Math.hypot(horizontal,up)<12) { aim=null;return }
    const direction=screenDirection(horizontal,up,scene.activeCamera.beta)
    const camera=scene.activeCamera
    const metersPerPixel=(camera.orthoRight-camera.orthoLeft)/Math.max(1,rect.width)
    aimDistance=Math.max(3,Math.min(18,Math.hypot(horizontal,up/Math.max(.1,Math.cos(camera.beta)))*metersPerPixel))
    aim=true
    player.root.rotation.y=Math.atan2(direction.x,direction.z)
  }
  const key = event => {
    if (!['KeyR','KeyG'].includes(event.code) || !isPlaying() || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target?.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName)) return
    event.preventDefault()
    if(event.code==='KeyG') { grenadeRequested=true;return }
    if (useDebugStore.getState().infiniteAmmo) return
    const w = weapons[state.selected], ammo = state.ammo[state.selected]
    if (!reload && ammo.loaded < w.magazine && ammo.reserve) { reload = w.reload; audio.play('reload-out',{duration:w.reload}); publish() }
  }
  canvas.addEventListener('pointermove',pointer); canvas.addEventListener('pointerleave',clear)
  window.addEventListener('blur',clear); window.addEventListener('keydown',key)
  publish()
  useCombatStore.getState().publish({accuracy:null,result:null})
  return {
    clear, facePointer,
    snapshot: () => structuredClone(state),
    update(dt, spawning, world, { moving = false, running = false } = {}) {
      const playing=isPlaying()
      if(cursorPlaying!==playing) {
        canvas.style.cursor=playing?aimingCursor:previousCursor
        cursorPlaying=playing
      }
      gun.setEnabled(playing)
      tracers.update(dt)
      if (!isPlaying()) { clear(); return }
      grenades.update(dt,world,spawning)
      throwCooldown=Math.max(0,throwCooldown-dt)
      if(grenadeRequested) {
        grenadeRequested=false
        const infiniteGrenades=useDebugStore.getState().infiniteGrenades
        if(aim && !throwCooldown && (infiniteGrenades || state.grenades>0) && grenades.throw(player.root.position,player.root.rotation.y,aimDistance)) {
          if(!infiniteGrenades) state.grenades--;throwCooldown=.6;publish()
        }
      }
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
      if (!infiniteAmmo && !reload && !ammo.loaded && ammo.reserve) { reload=w.reload;audio.play('reload-out',{duration:w.reload});publish() }
      if (!aim || reload || cooldown || (!infiniteAmmo && !ammo.loaded)) return
      const p=player.root.position, heading=player.root.rotation.y
      // 鼠标决定身体方向，仅在前方 ±6° 内寻找可见、无遮挡目标。
      const targets=spawning.targets().map(target => {
        const dx=target.x-p.x,dz=target.z-p.z,distance=Math.hypot(dx,dz)
        const angle=Math.atan2(dx,dz), delta=Math.atan2(Math.sin(angle-heading),Math.cos(angle-heading))
        return {...target,distance,angle,delta}
      }).filter(target=>target.distance<=w.range && Math.abs(target.delta)<=Math.PI*6/180)
        .sort((a,b)=>Math.abs(a.delta)-Math.abs(b.delta)||a.distance-b.distance||a.id.localeCompare(b.id))
      const clearDistance = (dx,dz,range) => {
        for(let t=.2;t<=range;t+=.2) {
          if(world.projectileBlocked(p.x+dx*t,p.y+1.1,p.z+dz*t)) return t
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
        const assisted=heading+Math.max(-Math.PI/60,Math.min(Math.PI/60,target.delta))
        const angle=assisted+(accurate ? (Math.random()-.5)*w.spread*.4 : missAngle+(Math.random()-.5)*w.spread)
        const dx=Math.sin(angle), dz=Math.cos(angle)
        const headshot=accurate && Math.random()<w.headshot*(running ? .4 : moving ? .65 : 1)
        const hit=spawning.shoot(p.x,p.z,dx,dz,clearDistance(dx,dz,w.range),w.damage*(headshot?2:1),{headshot,penetration:w.penetration ?? 1,penetrationDecay:w.penetrationDecay ?? 1})
        const distance=hit.distance
        if(hit.hit) result=headshot?'爆头 ×2':result==='爆头 ×2'?result:'命中'
        tracers.emit(p.x,p.y+1.1,p.z,p.x+dx*distance,p.z+dz*distance,headshot && hit.hit)
      }
      feedbackTime=.6; useCombatStore.getState().publish({result})
    },
    dispose() {
      scene.doNotHandleCursors=previousCursorHandling
      canvas.style.cursor=previousCursor
      clear(); grenades.dispose(); audio.dispose(); gun.dispose();material.dispose();tracers.dispose()
      canvas.removeEventListener('pointermove',pointer);canvas.removeEventListener('pointerleave',clear)
      window.removeEventListener('blur',clear);window.removeEventListener('keydown',key)
    },
  }
}
