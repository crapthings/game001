import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { openingRoadblock } from './openingStory.js'
import { createOpeningRoadblock } from './createOpeningRoadblock.js'
import { createOpeningVehicle } from './createOpeningVehicle.js'
import { useOpeningStore } from '../../../stores/useOpeningStore.js'
import { useGameStore } from '../../../stores/useGameStore.js'
import { useWorldStore } from '../../../stores/useWorldStore.js'

const dialogue = [
  { speaker: '你', text: '没油了……偏偏在这儿。' },
  { speaker: '你', text: '前面的路也堵死了。看来只能走过去了。' },
  { speaker: '你', text: '一点动静都没有……先去附近看看，有没有能用的东西。' },
]
// 无动力滑行：速度逐渐降低，到停车点时为零。
const coast = t => 1 - (1 - t) ** 2

export function createOpeningDirector(scene, world, plan, progress, player, gameCamera) {
  if (!plan.opening) return null
  const opening = plan.opening, hud = useOpeningStore.getState()
  const vehicle = createOpeningVehicle(scene)
  const block = openingRoadblock(opening)
  const roadblock = createOpeningRoadblock(scene, block, world.terrain.surfaceHeight(...block.position))
  const camera = new FreeCamera('opening-camera', Vector3.Zero(), scene)
  camera.minZ = 0.1; camera.maxZ = 64
  const savedFog = { start: scene.fogStart, end: scene.fogEnd }
  const restoreFog = () => { scene.fogStart = savedFog.start; scene.fogEnd = savedFog.end }
  let stage = progress.opening?.status === 'complete' ? 'complete' : 'preloading'
  let disposed = false, elapsed = 0, lineIndex = 0, fade = 0, transition = null, retry = null
  let releaseLoad = null
  let dialogueLook = null
  const releases = []
  const terrainPoint = (point, height = 0) => new Vector3(point[0], world.terrain.surfaceHeight(...point) + height, point[1])
  function park() {
    vehicle.root.position.copyFrom(terrainPoint(opening.parking.position))
    vehicle.root.rotation.y = opening.parking.yaw
    player.root.position.copyFrom(terrainPoint(opening.playerExit))
    player.root.rotation.y = Math.atan2(block.position[0] - opening.playerExit[0], block.position[1] - opening.playerExit[1])
    player.setEnabled(true)
    player.update(0, false, player.root.position.y)
  }
  vehicle.root.position.copyFrom(terrainPoint(stage === 'complete' ? opening.parking.position : opening.entry))
  vehicle.root.rotation.y = opening.parking.yaw
  releases.push(world.addCollider('opening-vehicle', () => ({ x: vehicle.root.position.x, z: vehicle.root.position.z, rotation: vehicle.root.rotation.y, halfWidth: 1.2, halfDepth: 2.3 })))
  releases.push(world.addCollider('opening-roadblock', () => ({ x: block.position[0], z: block.position[1], rotation: block.yaw, halfWidth: block.width / 2, halfDepth: block.depth / 2 })))
  if (stage !== 'complete') {
    const b = opening.preloadBounds
    // 固定镜头最远裁剪 64m，限制横/纵 FOV；96m 余量覆盖整个视锥。
    releaseLoad = world.lockBounds({ minX: b.minX - 96, maxX: b.maxX + 96, minZ: b.minZ - 96, maxZ: b.maxZ + 96 })
    player.setEnabled(false)
  }
  vehicle.root.setEnabled(false); roadblock.root.setEnabled(false)

  function publish(extra = {}) {
    hud.publish({ stage, fade, line: stage === 'dialogue' ? dialogue[lineIndex] : null, busy: Boolean(transition), ...extra })
  }
  function frameArrival() {
    // 跟拍镜头始终朝向地图内部；避免入口后方露出地图外空白。
    const forward = [Math.sin(opening.yaw), Math.cos(opening.yaw)]
    const right = [forward[1], -forward[0]]
    camera.position.set(vehicle.root.position.x - forward[0] * 8 + right[0] * 10, vehicle.root.position.y + 6, vehicle.root.position.z - forward[1] * 8 + right[1] * 10)
    camera.setTarget(vehicle.root.position.add(new Vector3(0, 1, 0)))
  }
  function frameDialogue() {
    const shot = opening.shots.find(item => item.id === 'dialogue')
    camera.position.set(shot.position[0], world.terrain.surfaceHeight(shot.position[0], shot.position[2]) + shot.position[1], shot.position[2])
    dialogueLook = player.root.position.add(new Vector3(0, 1.3, 0))
    camera.setTarget(dialogueLook)
  }
  async function save(status) {
    const saved = await useWorldStore.getState().dispatch({ type: 'opening', id: opening.id, status })
    if (!saved) throw new Error('开场进度未保存，请重试。')
  }
  function fadeThrough(action, next) {
    if (transition || disposed) return
    retry = null
    transition = { mode: 'out', action, next }
    publish({ error: null })
  }
  function complete() {
    fadeThrough(async () => {
      park()
      await save('complete')
      if (disposed) return
      gameCamera.setTarget(player.root.position.add(new Vector3(0, 0.7, 0)), false, false, true)
      scene.activeCamera = gameCamera
      restoreFog()
    }, 'complete')
  }
  function advance() {
    if (disposed || useGameStore.getState().phase !== 'cinematic') return
    if (retry) { const task = retry; retry = null; task(); return }
    if (transition || stage !== 'dialogue') return
    if (lineIndex + 1 < dialogue.length) { lineIndex++; publish() }
    else complete()
  }
  function skip() {
    if (disposed || transition || retry || useGameStore.getState().phase !== 'cinematic') return
    complete()
  }
  function beginDialogue() {
    fadeThrough(async () => {
      park()
      await save('parked')
      if (!disposed) frameDialogue()
    }, 'dialogue')
  }
  hud.publish({ stage, fade: 0, line: null, busy: false, error: null, advance, skip })

  return {
    get active() { return stage !== 'complete' || Boolean(transition) },
    start() {
      if (stage !== 'preloading') return
      vehicle.root.setEnabled(true); roadblock.root.setEnabled(true)
      scene.activeCamera = camera
      scene.fogStart = 24; scene.fogEnd = 56
      useGameStore.getState().beginCinematic()
      if (progress.opening?.status === 'parked') {
        park(); frameDialogue(); stage = 'dialogue'; fade = 1
        transition = { mode: 'in', next: 'dialogue' }
      } else { stage = 'arriving'; frameArrival() }
      publish()
    },
    update(dt) {
      if (disposed) return
      const aspect = scene.getEngine().getRenderWidth() / Math.max(1, scene.getEngine().getRenderHeight())
      camera.fov = 2 * Math.atan(Math.tan(Math.PI / 6) / Math.max(1, aspect))
      vehicle.root.setEnabled(world.isLoaded(vehicle.root.position.x, vehicle.root.position.z))
      roadblock.root.setEnabled(world.isLoaded(...block.position))
      if (stage === 'complete' && !transition) return
      if (useGameStore.getState().phase !== 'cinematic') return
      if (stage === 'dialogue') {
        player.update(dt, false, player.root.position.y)
        const target = Vector3.Lerp(player.root.position, terrainPoint(block.position), lineIndex === 1 ? 0.18 : 0).add(new Vector3(0, 1.3, 0))
        dialogueLook = Vector3.Lerp(dialogueLook || target, target, 1 - Math.exp(-dt * 4))
        camera.setTarget(dialogueLook)
      }
      if (transition) {
        const task = transition
        if (task.mode === 'out') {
          fade = Math.min(1, fade + dt / 0.35)
          if (fade === 1) {
            task.mode = 'saving'
            Promise.resolve().then(() => disposed ? undefined : task.action()).then(() => {
              if (disposed) return
              stage = task.next; task.mode = 'in'; publish()
            }).catch(error => {
              if (disposed) return
              transition = null
              retry = () => fadeThrough(task.action, task.next)
              publish({ error: error.message })
            })
          }
        } else if (task.mode === 'in') {
          fade = Math.max(0, fade - dt / 0.35)
          if (fade === 0) {
            transition = null
            if (stage === 'complete') {
              releaseLoad?.(); releaseLoad = null
              useGameStore.getState().finishCinematic()
            }
          }
        }
        publish()
        return
      }
      if (retry || stage !== 'arriving') return
      const nextElapsed = Math.min(7, elapsed + dt)
      const t = coast(nextElapsed / 7)
      const a = opening.entry, b = opening.parking.position
      const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t
      // 低速脚本行驶，2.6m 外接圆覆盖车体；未就绪或受阻时不推进时间。
      if (!world.canMove(x, z, 2.6, 'opening-vehicle')) return
      const distance = Math.hypot(x - vehicle.root.position.x, z - vehicle.root.position.z)
      vehicle.root.position.set(x, world.terrain.surfaceHeight(x, z), z)
      vehicle.roll(distance); elapsed = nextElapsed; frameArrival()
      if (elapsed === 7) beginDialogue()
    },
    dispose() {
      disposed = true
      releaseLoad?.(); releases.forEach(release => release())
      scene.activeCamera = gameCamera
      restoreFog()
      player.setEnabled(true)
      vehicle.dispose(); roadblock.dispose(); camera.dispose(); hud.reset()
    },
  }
}
