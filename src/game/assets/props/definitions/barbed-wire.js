import { box, cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.barbed-wire', name: '铁丝网',
  zones: ["city","industrial","roadside"], tags: ["defense","barrier"],
  footprint: { width: 3.2, depth: 0.5 },
}, {
  weathered: () => [
 ...[-1.5,1.5].map(x=>box([0.07,1.25,0.07],[x,0.625,0],C.rust)),
 ...[0.35,0.65,0.95,1.2].flatMap(y=>[
   box([3,0.022,0.022],[0,y,0],C.metal),
   ...Array.from({length:10},(_,i)=>box([0.11,0.018,0.018],[-1.35+i*0.3,y,0],C.rust,[0,0,0.75]))
 ]),
 ...[-1.5,1.5].map(x=>box([0.32,0.12,0.42],[x,0.06,0],C.concrete))
  ],
})
