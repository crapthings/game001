import { box, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.folding-table', name: '折叠桌',
  zones: ["universal"], tags: ["furniture","camp"],
  footprint: { width: 1.25, depth: 0.7 },
}, {
  weathered: () => [
    box([1.2,0.045,0.65],[0,0.7275,0],'#9a927a'),
    box([1.12,0.035,0.56],[0,0.69,0],C.metal),
    ...[-0.42,0.42].flatMap(x=>[-1,1].map(side=>box([0.035,0.77,0.035],[x,0.35,0],C.metal,[side*0.52,0,0]))),
    box([0.9,0.03,0.03],[0,0.28,0],C.rust)
  ],
})
