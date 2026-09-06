import { CHUNK_SIZE } from './terrain.js'

export const ROAD_RESOLUTION = 256
const RESOLUTION = ROAD_RESOLUTION
const clamp = (n) => Math.max(0, Math.min(1, n))

export function generateRoadPixels(chunk, terrain) {
  const x0 = chunk.x * CHUNK_SIZE, z0 = chunk.z * CHUNK_SIZE, pixelSize = CHUNK_SIZE / RESOLUTION
  if (!terrain.hasRoads(x0, z0, CHUNK_SIZE)) return
  const pixels = new Uint8ClampedArray(RESOLUTION * RESOLUTION * 4)
  let visible = false
  for (let row = 0; row < RESOLUTION; row += 1) for (let col = 0; col < RESOLUTION; col += 1) {
    const x = x0 + (col + 0.5) * pixelSize, z = z0 + (row + 0.5) * pixelSize
    const road = terrain.nearbyRoad(x, z)
    if (road.distance > road.width / 2 + 2.2 || !road.fade) continue
    const edge = road.distance - road.width / 2
    const grain = ((Math.imul(Math.floor(x * 23), 73856093) ^ Math.imul(Math.floor(z * 23), 19349663)) >>> 0) % 17 - 8
    const erosion = Math.sin(x * 2.3 + Math.sin(z * 1.7)) * 0.12
    const asphalt = clamp((0.2 - edge + erosion) / 0.45)
    const shoulder = clamp(((road.segment?.sidewalk ? 0.35 : 2) - edge + erosion) / 0.8)
    const alpha = shoulder * road.fade
    if (alpha < 0.01) continue
    visible = true
    const index = (row * RESOLUTION + col) * 4
    let color = [91, 94, 79].map((value, channel) => value * (1 - asphalt) + [49, 57, 54][channel] * asphalt + grain)
    // 交汇范围不画中心/边缘标线，避免标线穿过十字路口。
    const centerLine = road.distance < 0.11 && road.along % 7 < 3
    const edgeLine = Math.abs(road.distance - (road.width / 2 - 0.4)) < 0.09
    if (road.segment?.markings !== false && !road.junction && road.fade > 0.95 && (centerLine || edgeLine) && grain > -5) color = centerLine ? [151, 141, 103] : [132, 132, 113]
    pixels[index] = color[0]; pixels[index + 1] = color[1]; pixels[index + 2] = color[2]; pixels[index + 3] = Math.round(alpha * 255)
  }
  if (!visible) return null
  return pixels
}
