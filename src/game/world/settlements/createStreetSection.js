import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer'
import { CHUNK_SIZE } from '../chunks/terrain.js'
import { createRandom } from '../generation/random.js'
import { ROAD_SEGMENT_LENGTH } from './createRoadSurfaceCache.js'

// 世界坐标控制纹理和碎屑，区块只负责裁切、持有与释放。
export function createStreetSection(scene, parent, chunk, towns, surfaces, materials, seed) {
  const minX = chunk.x * CHUNK_SIZE, maxX = minX + CHUNK_SIZE
  const minZ = chunk.z * CHUNK_SIZE, maxZ = minZ + CHUNK_SIZE
  const debris = [], grass = []
  function strip(id, x0, x1, z0, z1, y, material, segmentStart, roadMinZ, roadWidth) {
    const left = Math.max(minX, x0), right = Math.min(maxX, x1)
    const back = Math.max(minZ, z0), front = Math.min(maxZ, z1)
    if (right <= left || front <= back) return
    const mesh = MeshBuilder.CreateGround(id, { width: right - left, height: front - back }, scene)
    const cx = (left + right) / 2, cz = (back + front) / 2
    mesh.position.set(cx, y, cz)
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind)
    const uvs = []
    for (let index = 0; index < positions.length; index += 3) uvs.push((positions[index] + cx - segmentStart) / ROAD_SEGMENT_LENGTH, (positions[index + 2] + cz - roadMinZ) / roadWidth)
    mesh.setVerticesData(VertexBuffer.UVKind, uvs)
    mesh.parent = parent
    mesh.material = material
    mesh.isPickable = false
  }
  for (const town of towns) {
    for (const road of town.roads) {
      const from = Math.min(road.from[0], road.to[0]), to = Math.max(road.from[0], road.to[0])
      const z = road.from[1], half = road.width / 2
      if (to <= minX || from >= maxX || z + half + 2 <= minZ || z - half - 2 >= maxZ) continue
      const first = Math.floor(Math.max(from, minX) / ROAD_SEGMENT_LENGTH)
      const last = Math.ceil(Math.min(to, maxX) / ROAD_SEGMENT_LENGTH) - 1
      for (let segment = first; segment <= last; segment += 1) {
        const segmentStart = segment * ROAD_SEGMENT_LENGTH
        const left = Math.max(from, segmentStart), right = Math.min(to, segmentStart + ROAD_SEGMENT_LENGTH)
        const resource = surfaces.acquire(town, road, segment)
        parent.onDisposeObservable.add(() => resource.release())
        const roadMinZ = z - half - 2, roadWidth = road.width + 4
        strip(`${town.id}:asphalt:${segment}`, left, right, z - half, z + half, town.elevation + 0.035, resource.material, segmentStart, roadMinZ, roadWidth)
        strip(`${town.id}:sidewalk-n:${segment}`, left, right, z + half, z + half + 2, town.elevation + 0.08, resource.material, segmentStart, roadMinZ, roadWidth)
        strip(`${town.id}:sidewalk-s:${segment}`, left, right, z - half - 2, z - half, town.elevation + 0.08, resource.material, segmentStart, roadMinZ, roadWidth)
        const random = createRandom(seed, town.id, road.id, segment, 'roadside-debris-v1')
        for (let index = 0; index < 18; index += 1) {
          const x = segmentStart + 0.6 + random() * (ROAD_SEGMENT_LENGTH - 1.2)
          const side = random() > 0.5 ? 1 : -1
          const dz = z + side * (half + 0.25 + random() * 1.5)
          const size = 0.1 + random() * 0.23
          const angle = random() * Math.PI * 2
          if (x < from || x >= to || x < minX || x >= maxX || dz < minZ || dz >= maxZ) continue
          if (index % 3 === 0) {
            const tuft = MeshBuilder.CreateCylinder('roadside-weed', { height: size * 2.4, diameterBottom: size, diameterTop: 0, tessellation: 3 }, scene)
            tuft.position.set(x, town.elevation + 0.08 + size * 1.2, dz)
            tuft.rotation.y = angle
            tuft.material = materials.weeds
            grass.push(tuft)
          } else {
            const stone = MeshBuilder.CreateBox('roadside-rubble', { width: size, height: size * 0.4, depth: size * 1.4 }, scene)
            stone.position.set(x, town.elevation + 0.08 + size * 0.2, dz)
            stone.rotation.y = angle
            stone.material = materials.rubble
            debris.push(stone)
          }
        }
      }
    }
  }
  // 每个区块至多两个装饰网格；细碎装饰不参与碰撞，保留行走通道。
  for (const group of [debris, grass]) {
    if (!group.length) continue
    const mesh = Mesh.MergeMeshes(group, true, true)
    mesh.parent = parent
    mesh.isPickable = false
  }
}
