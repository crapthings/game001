import { createRandom } from './random.js'

const clamp = value => Math.max(0, Math.min(1, value))
const samplers = new WeakMap()

export function createTopography(seed, hierarchy, version = 1) {
  const random = createRandom(seed, 'topography-v1')
  const profiles = { lowland: [-2, 0.85], rural: [5, 0.4], forest: [13, 0.55], upland: [28, 0.25] }
  const field = {
    version,
    anchors: hierarchy.macros.map(macro => ({
      x: (macro.bounds.minX + macro.bounds.maxX) / 2,
      z: (macro.bounds.minZ + macro.bounds.maxZ) / 2,
      height: profiles[macro.theme][0], moisture: profiles[macro.theme][1],
    })),
    waves: [720, 310, 115].map((wavelength, index) => ({
      wavelength, amplitude: [6, 2.5, 0.45][index], angle: random() * Math.PI * 2,
      phase: random() * Math.PI * 2,
    })),
  }
  if (version === 2) {
    const ridgeRandom = createRandom(seed, 'landforms-v2')
    field.ridges = hierarchy.macros.flatMap(macro => Array.from({ length: 3 }, (_, index) => ({
      x: macro.bounds.minX + 150 + ridgeRandom() * 724,
      z: macro.bounds.minZ + 150 + ridgeRandom() * 724,
      angle: ridgeRandom() * Math.PI,
      length: 160 + ridgeRandom() * 140,
      width: 65 + ridgeRandom() * 60,
      amplitude: (index === 2 ? -1 : 1) * (macro.theme === 'upland' ? 12 + ridgeRandom() * 12 : 5 + ridgeRandom() * 8),
    })))
  }
  return field
}

// 独立于聚落、生态和道路的原始地形；选址与地面渲染共享此函数。
export function createTopographySampler(field) {
  if (samplers.has(field)) return samplers.get(field)
  const cache = new Map()
  const ridges = field.version === 2 ? field.ridges.map(ridge => ({ ...ridge, cosine: Math.cos(ridge.angle), sine: Math.sin(ridge.angle) })) : []
  function base(x, z) {
    const key = `${x},${z}`
    if (cache.has(key)) return cache.get(key)
    let weight = 0, height = 0, moisture = 0
    for (const anchor of field.anchors) {
      const w = Math.exp(-((x - anchor.x) ** 2 + (z - anchor.z) ** 2) / (2 * 600 ** 2))
      weight += w; height += anchor.height * w; moisture += anchor.moisture * w
    }
    height /= weight; moisture /= weight
    for (const wave of field.waves) {
      const u = (x * Math.cos(wave.angle) + z * Math.sin(wave.angle)) * Math.PI * 2 / wave.wavelength
      height += Math.sin(u + wave.phase) * wave.amplitude
    }
    for (const ridge of ridges) {
      const dx = x - ridge.x, dz = z - ridge.z, c = ridge.cosine, s = ridge.sine
      const along = (dx * c + dz * s) / ridge.length
      const across = (-dx * s + dz * c) / ridge.width
      height += ridge.amplitude * Math.exp(-0.5 * (along * along + across * across))
    }
    // 相对低洼更潮湿，不把湿度误作水面或河流水系。
    moisture = clamp(moisture + (8 - height) * 0.012)
    const result = { height, moisture }
    if (cache.size >= 8192) cache.delete(cache.keys().next().value)
    cache.set(key, result)
    return result
  }
  function sample(x, z) {
    const point = base(x, z)
    const dx = (base(x + 4, z).height - base(x - 4, z).height) / 8
    const dz = (base(x, z + 4).height - base(x, z - 4).height) / 8
    const slope = Math.atan(Math.hypot(dx, dz)) * 180 / Math.PI
    const suitability = clamp(1 - slope / 10) * clamp((0.85 - point.moisture) / 0.4)
    return { ...point, slope, suitability }
  }
  const sampler = { base, sample }
  samplers.set(field, sampler)
  return sampler
}
