import { box, defineProp as defineNature } from '../../props/primitives.js'

export default defineNature({
  assetId: 'nature.fern-clump', name: '蕨类丛', zones: ['forest', 'wetland'], tags: ['groundcover'], radius: 0,
}, {
  default: () => Array.from({ length: 7 }, (_, i) => {
    const angle = i * 2.4, length = .48 + (i % 3) * .075
    const leaf = (width, depth, distance, height, tilt, color) => box(
      [width, .025, depth], [Math.sin(angle) * distance, height, Math.cos(angle) * distance],
      color, [tilt, angle, 0],
    )
    return [
      leaf(.045, length, length * .32, .16, -.45, '#526b42'),
      leaf(.19, length * .65, length * .7, .26, .12, i % 2 ? '#657d4d' : '#758b57'),
      leaf(.085, length * .4, length, .2, .55, '#879865'),
    ]
  }).flat(),
})
