import { box, defineProp as defineNature } from '../../props/primitives.js'

export default defineNature({
  assetId: 'nature.dry-grass', name: '枯草丛', zones: ['farmland', 'wilderness', 'roadside'], tags: ['groundcover'], radius: 0,
}, {
  default: () => Array.from({ length: 13 }, (_, i) => {
    const angle = i * 2.4, height = .25 + (i % 5) * .075
    const radius = .06 + (i % 4) * .055
    return box([.035 + (i % 3) * .009, height, .018],
      [Math.sin(angle) * radius, height * .46, Math.cos(angle) * radius],
      ['#777b52', '#94915f', '#aba175'][i % 3],
      [.16 + (i % 3) * .1, angle, .08 * Math.sin(i)])
  }),
})
