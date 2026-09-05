import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { createAssetRegistry } from '../../assets/createAssetRegistry.js'
import { townSurface } from '../settlements/createTownPlan.js'
import { createStreetSection } from '../settlements/createStreetSection.js'
import { createRoadSurfaceCache } from '../settlements/createRoadSurfaceCache.js'
import { createTerrain, generateChunk, chunkAt, chunkKey, requiredChunks, KEEP_RADIUS } from './terrain.js'

export function createStreamedWorld(scene, plan) {
  const towns = plan.settlements || []
  const terrain = createTerrain(plan.seed, towns)
  const assets = createAssetRegistry(scene)
  const loaded = new Map()
  const material = new StandardMaterial('terrain-material', scene)
  material.diffuseColor = Color3.White()
  material.specularColor = Color3.Black()
  const roadSurfaces = createRoadSurfaceCache(scene, plan.seed)
  const streetMaterials = {}
  for (const [name, color] of Object.entries({ rubble: '#7c7766', weeds: '#646e43' })) {
    const entry = new StandardMaterial(`street:${name}`, scene)
    entry.diffuseColor = Color3.FromHexString(color)
    entry.specularColor = Color3.Black()
    streetMaterials[name] = entry
  }
  let center = null, queue = []
  // 区域仅是语义和地标覆盖，不再绘制孤立的圆形区域底座。
  const overrides = new Map()
  for (const region of plan.regions) {
    for (const placement of region.placements) {
      const chunk = chunkAt(placement.position[0], placement.position[2])
      const key = chunkKey(chunk.x, chunk.z)
      if (!overrides.has(key)) overrides.set(key, [])
      overrides.get(key).push({ ...placement, regionId: region.id })
    }
  }
  for (const town of towns) {
    for (const placement of town.placements) {
      const chunk = chunkAt(placement.position[0], placement.position[2])
      const key = chunkKey(chunk.x, chunk.z)
      if (!overrides.has(key)) overrides.set(key, [])
      overrides.get(key).push({ ...placement, regionId: town.id, building: true })
    }
  }
  function load(chunk) {
    if (loaded.has(chunk.key)) return
    const data = generateChunk(terrain, chunk.x, chunk.z)
    const root = new TransformNode(`chunk:${chunk.key}`, scene)
    const mesh = new Mesh(`ground:${chunk.key}`, scene)
    mesh.parent = root
    const vertices = new VertexData()
    vertices.positions = data.positions
    vertices.indices = data.indices
    vertices.colors = data.colors
    const normals = []
    // 全局高度梯度计算法线，使相邻区块接缝光照一致。
    for (let index = 0; index < data.positions.length; index += 3) {
      const x = data.positions[index], z = data.positions[index + 2]
      const nx = terrain.height(x - 0.1, z) - terrain.height(x + 0.1, z)
      const nz = terrain.height(x, z - 0.1) - terrain.height(x, z + 0.1)
      const length = Math.hypot(nx, 0.2, nz)
      normals.push(nx / length, 0.2 / length, nz / length)
    }
    vertices.normals = normals
    vertices.applyToMesh(mesh)
    mesh.material = material
    mesh.receiveShadows = true
    mesh.metadata = { ground: true, chunkKey: chunk.key }
    createStreetSection(scene, root, chunk, towns, roadSurfaces, streetMaterials, plan.seed)
    const planned = overrides.get(chunk.key) || []
    const natural = data.placements.filter((placement) => !plan.regions.some((region) => Math.hypot(placement.position[0] - region.center[0], placement.position[2] - region.center[1]) < region.radius))
    const colliders = []
    for (const placement of [...natural, ...planned]) {
      const x = placement.position[0], z = placement.position[2]
      // 不占用出生点；地标代理留待真实交互素材接入。
      if (Math.hypot(x, z) < 5 || placement.assetId.startsWith('landmark.')) continue
      if (!placement.building && townSurface(towns, x, z)?.weight > 0.5) continue
      assets.create({ ...placement, position: [x, terrain.surfaceHeight(x, z), z] }, root, placement.regionId)
      if (placement.building) {
        colliders.push({ x, z, rotation: placement.rotation, halfWidth: placement.footprint.width * placement.scale / 2, halfDepth: placement.footprint.depth * placement.scale / 2 })
      } else {
        colliders.push({ x, z, radius: (placement.assetId === 'nature.tree' ? 0.45 : 0.9) * placement.scale })
      }
    }
    loaded.set(chunk.key, { root, colliders })
  }
  function update(x, z, budget = 2) {
    const next = chunkAt(x, z)
    if (!center || center.x !== next.x || center.z !== next.z) {
      center = next
      queue = requiredChunks(center).filter((chunk) => !loaded.has(chunk.key))
      for (const [key, entry] of loaded) {
        const [cx, cz] = key.split(',').map(Number)
        if (Math.abs(cx - center.x) > KEEP_RADIUS || Math.abs(cz - center.z) > KEEP_RADIUS) {
          entry.root.dispose()
          loaded.delete(key)
        }
      }
    }
    for (let index = 0; index < budget && queue.length; index += 1) load(queue.shift())
  }
  return {
    terrain,
    update,
    getStats: () => ({ loaded: loaded.size, queued: queue.length, center }),
    // 所有导航与移动共用这层检查，不依赖美术模型的三角面。
    canMove(x, z) {
      const at = chunkAt(x, z)
      if (!loaded.has(chunkKey(at.x, at.z))) return false
      for (const entry of loaded.values()) {
        if (entry.colliders.some((obstacle) => {
          const dx = x - obstacle.x, dz = z - obstacle.z
          if (obstacle.radius !== undefined) return Math.hypot(dx, dz) < obstacle.radius + 0.4
          const cosine = Math.cos(obstacle.rotation), sine = Math.sin(obstacle.rotation)
          const localX = dx * cosine - dz * sine, localZ = dx * sine + dz * cosine
          return Math.abs(localX) < obstacle.halfWidth + 0.4 && Math.abs(localZ) < obstacle.halfDepth + 0.4
        })) return false
      }
      return true
    },
    dispose() {
      queue = []
      for (const entry of loaded.values()) entry.root.dispose()
      loaded.clear()
      assets.dispose()
      material.dispose()
      roadSurfaces.dispose()
      Object.values(streetMaterials).forEach((entry) => entry.dispose())
    },
  }
}
