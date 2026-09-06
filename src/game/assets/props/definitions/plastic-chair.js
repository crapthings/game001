import { box, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.plastic-chair', name: '塑料椅',
  zones: ["city","village"], tags: ["furniture","seat"],
  footprint: { width: 0.6, depth: 0.6 },
}, {
  weathered: () => [
    box([0.48,0.05,0.46],[0,0.425,0],'#8a9080'),
    ...[-1,1].flatMap(x=>[-1,1].map(z=>box([0.045,0.4,0.045],[x*0.2,0.2,z*0.19],'#737a6a'))),
    ...[-0.2,0.2].map(x=>box([0.055,0.43,0.05],[x,0.65,-0.2],'#8a9080')),
    ...[-0.12,0,0.12].map(x=>box([0.065,0.27,0.04],[x,0.71,-0.2],'#8a9080')),
    box([0.45,0.06,0.06],[0,0.87,-0.2],'#777e6e')
  ],
})
