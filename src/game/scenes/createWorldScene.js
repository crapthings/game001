import { Scene } from '@babylonjs/core/scene'
import { Camera } from '@babylonjs/core/Cameras/camera'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { createStreamedWorld } from '../world/chunks/createStreamedWorld.js'
import { createCharacterModel } from '../assets/characters/createCharacterModel.js'
import { PLAYER_ASSET_ID } from '../assets/characters/catalog.js'
import { createStamina } from '../entities/createStamina.js'
import { usePlayerStatusStore } from '../../stores/usePlayerStatusStore.js'
import { createMovementInput } from '../core/createMovementInput.js'
import { useGameStore } from '../../stores/useGameStore.js'
import { useWorldStore } from '../../stores/useWorldStore.js'
import { useNavigationStore } from '../../stores/useNavigationStore.js'
import { insideRegion, insideWorld } from '../world/worldConfig.js'
import { createDayNightCycle } from '../world/createDayNightCycle.js'
import { useWorldTimeStore } from '../../stores/useWorldTimeStore.js'
import { SURVIVAL } from '../entities/survival.js'

export function createWorldScene(engine, canvas, { onLoading, onReady } = {}) {
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

  const player = createCharacterModel(scene, PLAYER_ASSET_ID)
  const input = createMovementInput(canvas, scene, () => useGameStore.getState().phase === 'playing')
  let world = null, activePlan = null, lastSaved = null, lastSavedFog = null
  let stamina = createStamina(), lastSavedStamina = null
  let dayNight = createDayNightCycle(), lastSavedWorldTime = null
  let initialChunkCount = 1, ready = false
  let foodDecay = 0, waterDecay = 0
  function flushSurvival() {
    if (!foodDecay && !waterDecay) return
    const owner = activePlan, food = foodDecay, water = waterDecay
    foodDecay = 0; waterDecay = 0
    useWorldStore.getState().dispatch({ type: 'survival-tick', food, water }).then(saved => {
      if (!saved && activePlan === owner) { foodDecay += food; waterDecay += water }
    })
  }
  let saveTimer = 0, exploreTimer = 0, navigationTimer = 0, lightingTimer = 0
  function applyLighting() {
    const state = dayNight.lighting()
    scene.clearColor.set(state.sky[0], state.sky[1], state.sky[2], 1)
    scene.fogColor.set(...state.fog)
    ambient.intensity = state.ambient
    ambient.groundColor.set(state.fog[0] * 0.75, state.fog[1] * 0.8, state.fog[2] * 0.85)
    sun.intensity = state.sun
    sun.diffuse.set(...state.sunColor)
    sun.direction.set(...state.direction)
    useWorldTimeStore.getState().publish({ time: state.time, period: state.period, daylight: state.daylight })
  }
  function syncWorld(document) {
    if (!document || document.world === activePlan) return
    world?.dispose()
    world = createStreamedWorld(scene, document.world)
    ready = false
    activePlan = document.world
    foodDecay = 0; waterDecay = 0
    input.clear()
    stamina = createStamina(document.progress.stamina)
    dayNight = createDayNightCycle(document.progress.worldTime)
    lastSavedStamina = JSON.stringify(stamina.snapshot())
    lastSavedWorldTime = dayNight.snapshot()
    usePlayerStatusStore.getState().publish(stamina.hud())
    applyLighting()
    let position = document.progress.playerPosition || document.world.spawn || [0, 0]
    if (!insideWorld(document.world.bounds, ...position, 1)) position = document.world.spawn
    player.root.position.set(position[0], world.terrain.surfaceHeight(...position), position[1])
    lastSaved = [...position]
    world.update(...position, 1)
    const initial = world.getStats()
    initialChunkCount = initial.required
    onLoading?.({ progress: 45, label: `正在生成附近区域 0/${initialChunkCount}` })
    camera.setTarget(player.root.position.add(new Vector3(0, 0.7, 0)), false, false, true)
    player.update(0, false, player.root.position.y)
    const p = player.root.position
    useNavigationStore.getState().reset({ x: p.x, y: p.y, z: p.z }, document.progress.exploredFog, document.world.bounds)
    lastSavedFog = useNavigationStore.getState().fog
    saveTimer = 0
    exploreTimer = 0
    navigationTimer = 0
    lightingTimer = 0
  }
  async function checkpoint() {
    if (!ready || !world || useWorldStore.getState().document?.world !== activePlan) return
    flushSurvival()
    const owner = activePlan
    const position = [player.root.position.x, player.root.position.z]
    const fog = useNavigationStore.getState().fog
    const staminaState = stamina.snapshot()
    const staminaKey = JSON.stringify(staminaState)
    const worldTime = dayNight.snapshot()
    if (lastSaved && Math.hypot(position[0] - lastSaved[0], position[1] - lastSaved[1]) < 0.05 && fog === lastSavedFog && staminaKey === lastSavedStamina && Math.abs(worldTime - lastSavedWorldTime) < 0.0001) return
    if (await useWorldStore.getState().dispatch({ type: 'checkpoint', position, fog, stamina: staminaState, worldTime }) && activePlan === owner) {
      lastSaved = position
      lastSavedFog = fog
      lastSavedStamina = staminaKey
      lastSavedWorldTime = worldTime
    }
  }
  syncWorld(useWorldStore.getState().document)
  const unsubscribeWorld = useWorldStore.subscribe((state) => syncWorld(state.document))
  const unsubscribePhase = useGameStore.subscribe((state, previous) => {
    if (state.phase !== previous.phase) {
      input.clear()
      usePlayerStatusStore.getState().publish({ ...stamina.hud(), mode: stamina.snapshot().exhausted ? 'exhausted' : 'idle' })
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
    if (!ready) {
      const stats = world.getStats()
      initialChunkCount = stats.required
      const loaded = stats.ready
      const progress = 45 + 40 * loaded / initialChunkCount + 10 * stats.templatesReady / Math.max(1, stats.templatesTotal)
      onLoading?.({ progress, label: `附近区域 ${loaded}/${initialChunkCount} · 素材 ${stats.templatesReady}/${stats.templatesTotal}` })
      if (stats.queued === 0 && stats.templatesReady === stats.templatesTotal) {
        // 异步区块未完成时不能做出生点碰撞判断；否则读档会被误判并传回出生点。
        if (!world.canMove(position.x, position.z)) {
          const spawn = activePlan.spawn || [0, 0]
          if (Math.hypot(position.x - spawn[0], position.z - spawn[1]) < 0.01) throw new Error('出生点被占用，无法进入世界。')
          position.set(spawn[0], world.terrain.surfaceHeight(...spawn), spawn[1])
          world.update(...spawn)
          camera.setTarget(position.add(new Vector3(0, 0.7, 0)), false, false, true)
          useNavigationStore.getState().update({ x: position.x, y: position.y, z: position.z }, player.root.rotation.y)
          return
        }
        ready = true
        onLoading?.({ progress: 100, label: '世界准备完成' })
        onReady?.()
      }
    }
    if (useGameStore.getState().phase !== 'playing') return
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.05)
    dayNight.update(dt)
    lightingTimer += dt
    if (lightingTimer >= 0.1) {
      lightingTimer = 0
      applyLighting()
    }
    const direction = input.direction(position)
    const wantsSprint = input.wantsSprint()
    const needs = useWorldStore.getState().document?.progress.survival
    const depleted = needs && (needs.food <= 0 || needs.water <= 0)
    const distance = Math.min(stamina.speed(wantsSprint && !depleted) * dt, direction.distance ?? Infinity)
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
    const running = stamina.update(dt, moving, wantsSprint && !depleted)
    foodDecay += SURVIVAL.foodPerSecond * dt * (running ? 1.5 : 1)
    waterDecay += SURVIVAL.waterPerSecond * dt * (running ? 2 : 1)
    if (moving) player.root.rotation.y = Math.atan2(direction.x, direction.z)
    player.update(dt, moving, world.terrain.surfaceHeight(position.x, position.z), running)
    camera.setTarget(position.add(new Vector3(0, 0.7, 0)), false, false, true)
    navigationTimer += dt
    if (navigationTimer >= 0.1) {
      navigationTimer = 0
      usePlayerStatusStore.getState().publish(stamina.hud())
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
        if (!store.document.progress.discoveredRegionIds.includes(region.id) && insideRegion(region, position.x, position.z)) {
          store.dispatch({ type: 'discover', regionId: region.id })
        }
      }
    }
  })
  scene.onDisposeObservable.add(() => {
    checkpoint()
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
