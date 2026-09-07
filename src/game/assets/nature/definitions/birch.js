import { box, cylinder, sphere, defineProp as defineNature } from '../../props/primitives.js'

export default defineNature({
  assetId: 'nature.birch', name: '白桦树', zones: ['forest', 'wilderness'], tags: ['tree'], radius: .22,
}, {
  default: () => [
    cylinder([.35, 5.3, .16], [0, 2.65, 0], '#c2c0aa'),
    ...[1, 2, 3, 4].map((y, i) => box([.2, .055 + i * .008, .025], [0, y, .15 - i * .015], '#626454', [0, i * .3, .08])),
    cylinder([.14, 1.7, .04], [-.42, 3.85, .08], '#aaa992', [0, 0, .6]),
    cylinder([.12, 1.5, .035], [.38, 4.45, -.1], '#aaa992', [0, 0, -.55]),
    sphere([2.05, 1.65, 1.8], [-.6, 4.05, .15], '#4e6546'),
    sphere([1.9, 1.85, 1.65], [.6, 4.65, -.2], '#62794e'),
    sphere([1.65, 1.7, 1.5], [-.12, 5.45, .12], '#7a8b5c'),
    sphere([1.1, .85, 1.2], [-.75, 4.8, .35], '#718455'),
  ],
})
