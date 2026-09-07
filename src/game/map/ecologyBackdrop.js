import { sampleEcology } from '../world/biomes/sampleEcology.js'

const backdrops = new WeakMap()

// 每张世界快照只采样一次；地图缩放与玩家移动复用同一生态底图。
export function ecologyBackdrop(plan) {
  if (backdrops.has(plan)) return backdrops.get(plan)
  const bounds = plan.bounds
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil((bounds.maxX - bounds.minX) / 8)
  canvas.height = Math.ceil((bounds.maxZ - bounds.minZ) / 8)
  const context = canvas.getContext('2d')
  if (!context) return null
  const pixels = context.createImageData(canvas.width, canvas.height)
  for (let row = 0; row < canvas.height; row++) {
    const z = bounds.maxZ - (row + .5) / canvas.height * (bounds.maxZ - bounds.minZ)
    for (let col = 0; col < canvas.width; col++) {
      const x = bounds.minX + (col + .5) / canvas.width * (bounds.maxX - bounds.minX)
      const { color } = sampleEcology(plan, x, z)
      const offset = (row * canvas.width + col) * 4
      for (let channel = 0; channel < 3; channel++) pixels.data[offset + channel] = Math.round(color[channel] * 255)
      pixels.data[offset + 3] = 255
    }
  }
  context.putImageData(pixels, 0, 0)
  backdrops.set(plan, canvas)
  return canvas
}
