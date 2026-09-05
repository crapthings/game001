import { Scene } from '@babylonjs/core/scene'
import { Camera } from '@babylonjs/core/Cameras/camera'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { createStreamedWorld } from '../world/chunks/createStreamedWorld.js'
import { createPlayer } from '../entities/createPlayer.js'
import { createMovementInput } from '../core/createMovementInput.js'
import { useGameStore } from '../../stores/useGameStore.js'
import { useWorldStore } from '../../stores/useWorldStore.js'
import { useNavigationStore } from '../../stores/useNavigationStore.js'

export function createWorldScene(engine, canvas) {
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.105, 0.14, 0.13, 1)
  scene.fogMode = Scene.FOGMODE_LINEAR
  scene.fogColor = new Color3(0.105, 0.14, 0.13)
  scene.fogStart = 52
  scene.fogEnd = 88
  const camera = new ArcRotateCamera('camera', -Math.PI / 4, Math.PI / 4, 40, Vector3.Zero(), scene)
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA
  camera.minZ = 0.1
  camera.maxZ = 160
  // 固定 45° 俯视，不注册鼠标旋转输入。视野宽度上限防止超宽屏露出加载边缘。
  function resizeCamera() {
    const aspect = engine.getRenderWidth() / Math.max(1, engine.getRenderHeight())
    const halfHeight = Math.min(18, 44 / aspect)
    camera.orthoTop = halfHeight
    camera.orthoBottom = -halfHeight
    camera.orthoLeft = -halfHeight * aspect
    camera.orthoRight = halfHeight * aspect
  }
  resizeCamera()
  const resizeObserver = engine.onResizeObservable.add(resizeCamera)
  const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene)
  ambient.intensity = 0.8
  ambient.groundColor = new Color3(0.12, 0.15, 0.16)
  const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, 0.4), scene)
  sun.diffuse = new Color3(1, 0.88, 0.7)
  sun.intensity = 0.9

  const player = createPlayer(scene)
  const input = createMovementInput(canvas, scene, () => useGameStore.getState().phase === 'playing')
  let world = null, activePlan = null, lastSaved = null, lastSavedFog = null
  let saveTimer = 0, exploreTimer = 0, navigationTimer = 0
  function syncWorld(document) {
    if (!document || document.world === activePlan) return
    world?.dispose()
    world = createStreamedWorld(scene, document.world)
    activePlan = document.world
    input.clear()
    let position = document.progress.playerPosition || [0, 0]
    player.root.position.set(position[0], world.terrain.surfaceHeight(...position), position[1])
    lastSaved = [...position]
    world.update(...position, 25)
    if (!world.canMove(...position)) {
      // 旧版野外存档可能恰好落在新增建筑内部，迁移到最近的主街安全位置。
      position = [Math.max(-60, Math.min(60, position[0])), 0]
      world.update(...position, 25)
      player.root.position.set(position[0], world.terrain.surfaceHeight(...position), position[1])
    }
    camera.setTarget(player.root.position.add(new Vector3(0, 0.7, 0)), false, false, true)
    player.update(0, false, player.root.position.y)
    const p = player.root.position
    useNavigationStore.getState().reset({ x: p.x, y: p.y, z: p.z }, document.progress.exploredFog)
    lastSavedFog = useNavigationStore.getState().fog
    saveTimer = 0
    exploreTimer = 0
    navigationTimer = 0
  }
  function checkpoint() {
    if (!world || useWorldStore.getState().document?.world.seed !== activePlan.seed) return
    const position = [player.root.position.x, player.root.position.z]
    const fog = useNavigationStore.getState().fog
    if (lastSaved && Math.hypot(position[0] - lastSaved[0], position[1] - lastSaved[1]) < 0.05 && fog === lastSavedFog) return
    if (useWorldStore.getState().dispatch({ type: 'checkpoint', position, fog })) {
      lastSaved = position
      lastSavedFog = fog
    }
  }
  syncWorld(useWorldStore.getState().document)
  const unsubscribeWorld = useWorldStore.subscribe((state) => syncWorld(state.document))
  const unsubscribePhase = useGameStore.subscribe((state, previous) => {
    if (state.phase !== previous.phase) {
      input.clear()
      if (previous.phase === 'playing' || state.phase === 'playing') {
        const p = player.root.position
        useNavigationStore.getState().update({ x: p.x, y: p.y, z: p.z }, player.root.rotation.y)
      }
      if (previous.phase === 'playing') checkpoint()
    }
  })
  window.addEventListener('pagehide', checkpoint)

  scene.onBeforeRenderObservable.add(() => {
    if (!world) return
    const position = player.root.position
    world.update(position.x, position.z)
    if (useGameStore.getState().phase !== 'playing') return
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.05)
    const direction = input.direction(position)
    const distance = Math.min(9 * dt, direction.distance ?? Infinity)
    const dx = direction.x * distance, dz = direction.z * distance
    const oldX = position.x, oldZ = position.z
    if (world.canMove(position.x + dx, position.z + dz)) {
      position.x += dx
      position.z += dz
    } else {
      if (world.canMove(position.x + dx, position.z)) position.x += dx
      if (world.canMove(position.x, position.z + dz)) position.z += dz
    }
    const moving = Math.hypot(position.x - oldX, position.z - oldZ) > 0.001
    if (moving) player.root.rotation.y = Math.atan2(direction.x, direction.z)
    player.update(dt, moving, world.terrain.surfaceHeight(position.x, position.z))
    camera.setTarget(position.add(new Vector3(0, 0.7, 0)), false, false, true)
    navigationTimer += dt
    if (navigationTimer >= 0.1) {
      navigationTimer = 0
      useNavigationStore.getState().update({ x: position.x, y: position.y, z: position.z }, player.root.rotation.y)
    }
    saveTimer += dt
    exploreTimer += dt
    if (saveTimer >= 2) {
      checkpoint()
      saveTimer = 0
      // 开发环境供浏览器验证读取；不显示为游戏面板，也不写入存档。
      if (import.meta.env.DEV) canvas.dataset.runtime = JSON.stringify({ x: position.x, z: position.z, alpha: camera.alpha, beta: camera.beta, ...world.getStats() })
    }
    if (exploreTimer >= 0.5) {
      exploreTimer = 0
      const store = useWorldStore.getState()
      for (const region of activePlan.regions) {
        if (!store.document.progress.discoveredRegionIds.includes(region.id) && Math.hypot(position.x - region.center[0], position.z - region.center[1]) <= region.radius) {
          store.dispatch({ type: 'discover', regionId: region.id })
        }
      }
    }
  })
  scene.onDisposeObservable.add(() => {
    unsubscribeWorld()
    unsubscribePhase()
    window.removeEventListener('pagehide', checkpoint)
    engine.onResizeObservable.remove(resizeObserver)
    input.dispose()
    delete canvas.dataset.runtime
    player.dispose()
    world?.dispose()
  })
  return scene
}
