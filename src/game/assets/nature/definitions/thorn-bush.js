import { cylinder, sphere, defineProp as defineNature } from '../../props/primitives.js'

export default defineNature({
  assetId: 'nature.thorn-bush', name: '荆棘灌丛', zones: ['wilderness', 'farmland', 'village'], tags: ['shrub'], radius: .48,
}, {
  default: () => [
    ...Array.from({ length: 5 }, (_, i) => {
      const a = i * 2.4
      return cylinder([.055, .65 + (i % 2) * .15, .015],
        [Math.sin(a) * .2, .33, Math.cos(a) * .2], '#786b50', [.22, a, .28])
    }),
    sphere([.8, .55, .7], [-.2, .48, .08], '#4b6041'),
    sphere([.65, .65, .6], [.22, .64, -.1], '#617449'),
    sphere([.55, .4, .5], [-.15, .78, -.05], '#7b8756'),
    sphere([.5, .35, .45], [.32, .38, .2], '#6c7950'),
  ],
})
