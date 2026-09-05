import { createRandom } from '../generation/random.js'
import { townSurface } from '../settlements/createTownPlan.js'

export const CHUNK_SIZE = 32
export const CHUNK_SEGMENTS = 8
export const LOAD_RADIUS = 2
export const KEEP_RADIUS = 3
export const TERRAIN_VERSION = 1

const smooth = (value) => value * value * (3 - 2 * value)
export function createTerrain(seed, settlements = []) {
  // 以全局坐标采样，不以区块局部坐标造山，边界顶点严格一致。
  function noise(x, z, wavelength, channel) {
    const sx = x / wavelength, sz = z / wavelength
    const ix = Math.floor(sx), iz = Math.floor(sz)
    const tx = smooth(sx - ix), tz = smooth(sz - iz)
    const sample = (dx, dz) => createRandom(seed, TERRAIN_VERSION, channel, ix + dx, iz + dz)() * 2 - 1
    const a = sample(0, 0) * (1 - tx) + sample(1, 0) * tx
    const b = sample(0, 1) * (1 - tx) + sample(1, 1) * tx
    return a * (1 - tz) + b * tz
  }
  const pathDistance = (x, z) => Math.abs(z - Math.sin(x / 42) * 8)
  function height(x, z) {
    const base = noise(x, z, 80, 'hills') * 2.6 + noise(x, z, 24, 'detail') * 0.45
    const surface = townSurface(settlements, x, z)
    return surface ? base * (1 - surface.weight) + surface.town.elevation * surface.weight : base
  }
  function surfaceHeight(x, z) {
    const step = CHUNK_SIZE / CHUNK_SEGMENTS
    const x0 = Math.floor(x / step) * step, z0 = Math.floor(z / step) * step
    const tx = (x - x0) / step, tz = (z - z0) / step
    const a = height(x0, z0), b = height(x0 + step, z0), c = height(x0, z0 + step)
    if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz
    const d = height(x0 + step, z0 + step)
    return d + (c - d) * (1 - tx) + (b - d) * (1 - tz)
  }
  return { seed, settlements, height, surfaceHeight, noise, pathDistance }
}

export function chunkAt(x, z) {
  return { x: Math.floor(x / CHUNK_SIZE), z: Math.floor(z / CHUNK_SIZE) }
}
export const chunkKey = (x, z) => `${x},${z}`
export function requiredChunks(center, radius = LOAD_RADIUS) {
  const result = []
  for (let z = center.z - radius; z <= center.z + radius; z += 1) {
    for (let x = center.x - radius; x <= center.x + radius; x += 1) {
      result.push({ x, z, key: chunkKey(x, z), priority: (x - center.x) ** 2 + (z - center.z) ** 2 })
    }
  }
  return result.sort((a, b) => a.priority - b.priority || a.x - b.x || a.z - b.z)
}

export function generateChunk(terrain, cx, cz) {
  const positions = [], indices = [], colors = [], placements = []
  const step = CHUNK_SIZE / CHUNK_SEGMENTS
  for (let z = 0; z <= CHUNK_SEGMENTS; z += 1) {
    for (let x = 0; x <= CHUNK_SEGMENTS; x += 1) {
      const wx = cx * CHUNK_SIZE + x * step, wz = cz * CHUNK_SIZE + z * step
      const y = terrain.height(wx, wz)
      positions.push(wx, y, wz)
      const path = Math.max(0, 1 - terrain.pathDistance(wx, wz) / 5)
      const variation = terrain.noise(wx, wz, 12, 'color') * 0.025
      const town = townSurface(terrain.settlements, wx, wz)
      const weight = town?.weight || 0
      const natural = [0.19 + path * 0.13 + variation, 0.25 + path * 0.025 + variation, 0.19 - path * 0.015 + variation]
      const urban = [0.31 + variation, 0.30 + variation, 0.26 + variation]
      colors.push(...natural.map((color, index) => color * (1 - weight) + urban[index] * weight), 1)
    }
  }
  const stride = CHUNK_SEGMENTS + 1
  for (let z = 0; z < CHUNK_SEGMENTS; z += 1) {
    for (let x = 0; x < CHUNK_SEGMENTS; x += 1) {
      const a = z * stride + x
      indices.push(a, a + 1, a + stride, a + 1, a + stride + 1, a + stride)
    }
  }
  for (let index = 0; index < 16; index += 1) {
    const random = createRandom(terrain.seed, TERRAIN_VERSION, 'chunk-props', cx, cz, index)
    const x = (cx + 0.08 + random() * 0.84) * CHUNK_SIZE
    const z = (cz + 0.08 + random() * 0.84) * CHUNK_SIZE
    if (terrain.pathDistance(x, z) < 5 || Math.hypot(x, z) < 8) continue
    const tree = random() > 0.3
    placements.push({ id: `terrain/${cx}/${cz}/${index}`, assetId: tree ? 'nature.tree' : 'nature.rock', position: [x, terrain.height(x, z), z], rotation: random() * Math.PI * 2, scale: tree ? 0.9 + random() * 0.7 : 0.6 + random() * 0.7 })
  }
  return { x: cx, z: cz, key: chunkKey(cx, cz), positions, indices, colors, placements }
}
