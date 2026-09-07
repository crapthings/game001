import { sphere, defineProp as defineNature } from '../../props/primitives.js'
import { createRandom } from '../../../world/generation/random.js'

// 固定外观配方：偏心石簇配少量离散石子，避免重复的环形/放射状花纹。
function gravel(variant, count, width, depth) {
  const random = createRandom('gravel-shape-v2', variant)
  const parts = []
  for (let i = 0; i < count; i++) {
    const loose = i > count * .65
    const x = (random() + random() - 1) * width + (loose ? width * .45 : -width * .2)
    const z = (random() + random() - 1) * depth
    const size = .09 + random() ** 2 * .23
    const height = size * (.35 + random() * .35)
    const part = sphere([size * (1 + random() * .5), height, size * (.65 + random() * .5)],
      [x, height * .38, z], ['#77796a', '#878574', '#696e63'][Math.floor(random() * 3)])
    part.rotation = [0, random() * Math.PI, 0]
    parts.push(part)
  }
  return parts
}

export default defineNature({
  assetId: 'nature.gravel-patch', name: '碎石散落',
  zones: ['wilderness', 'roadside', 'industrial'], tags: ['groundcover', 'rock'], radius: 0,
}, {
  default: () => gravel('default', 9, .8, .45),
  sparse: () => gravel('sparse', 4, .65, .6),
  trail: () => gravel('trail', 11, 1.05, .25),
  broken: () => gravel('broken', 7, .8, .7),
  compact: () => gravel('compact', 12, .5, .4),
  scattered: () => gravel('scattered', 6, 1, .65),
})
