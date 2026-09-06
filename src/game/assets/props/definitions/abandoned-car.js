import { box, cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.abandoned-car', name: '废弃轿车',
  zones: ["city","village","roadside"], tags: ["vehicle","wreck","cover"],
  footprint: { width: 1.9, depth: 4.6 },
}, {
  weathered: () => [
 box([1.72,0.48,4.4],[0,0.61,0],C.metal),
 box([1.55,0.55,2.1],[0,1.1,-0.2],C.metal),
 box([1.38,0.36,0.035],[0,1.12,0.87],C.dark,[-0.15,0,0]),
 box([1.38,0.33,0.035],[0,1.12,-1.27],C.dark,[0.15,0,0]),
 ...[-1,1].flatMap(side => [
   box([0.035,0.32,0.77],[side*0.79,1.12,0.31],C.dark),
   box([0.035,0.32,0.77],[side*0.79,1.12,-0.59],C.dark),
   ...[-1.4,1.4].flatMap(z => [
     cylinder([0.63,0.22,0.63],[side*0.84,0.32,z],C.dark,[0,0,Math.PI/2]),
     cylinder([0.3,0.24,0.3],[side*0.85,0.32,z],C.rust,[0,0,Math.PI/2]),
   ]),
   box([0.3,0.16,0.05],[side*0.55,0.65,2.22],'#aaa48c'),
 ]),
 box([1.8,0.12,0.14],[0,0.43,2.25],C.rust),
 box([0.68,0.025,0.9],[-0.3,0.865,1.55],C.rust),
 box([0.55,0.025,0.6],[0.28,1.39,-0.4],C.rust)
  ],
})
