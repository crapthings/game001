import { sphere, defineProp as defineNature } from '../../props/primitives.js'

export default defineNature({
  assetId: 'nature.mossy-boulder', name: '覆苔巨石', zones: ['forest', 'wetland'], tags: ['rock'], radius: 1.0, projectileParts: [0, 1],
}, {
  default: () => [
    sphere([1.65, 1.3, 1.5], [-.1, .52, 0], '#74796e'),
    sphere([.9, .75, 1.05], [.5, .3, .1], '#858779'),
    sphere([.9, .14, .75], [-.25, 1.1, -.1], '#596d48'),
    sphere([.55, .13, .5], [.15, 1.02, .18], '#758351'),
    sphere([.4, .12, .5], [.65, .6, .1], '#65784c'),
  ],
})
