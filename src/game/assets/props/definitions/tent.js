import { box, cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.tent', name: '避难帐篷',
  zones: ["forest","wilderness","village"], tags: ["camp","shelter"],
  footprint: { width: 2.6, depth: 3 },
}, {
  weathered: () => [
 box([2.5,0.05,2.9],[0,0.025,0],C.dark),
 box([1.88,0.045,2.8],[-0.6,0.76,0],C.cloth,[0,0,0.89]),
 box([1.88,0.045,2.8],[0.6,0.76,0],C.cloth,[0,0,-0.89]),
 box([0.05,1.48,0.05],[0,0.74,-1.36],C.metal),
 box([0.05,1.48,0.05],[0,0.74,1.36],C.metal),
 box([0.07,0.07,2.9],[0,1.48,0],C.metal),
 ...[-1,1].flatMap(x=>[-1,1].map(z=>box([0.07,0.18,0.07],[x*1.23,0.09,z*1.43],C.rust)))
  ],
})
