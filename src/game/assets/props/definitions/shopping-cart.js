import { box, cylinder, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.shopping-cart', name: '购物车',
  zones: ["city","roadside"], tags: ["container","evacuation"],
  footprint: { width: 0.65, depth: 1.05 },
}, {
  weathered: () => [
    ...[-0.25,0.25].flatMap(x=>[-0.34,0.34].map(z=>cylinder([0.13,0.055,0.13],[x,0.065,z],C.dark,[0,0,Math.PI/2]))),
    ...[-0.24,0.24].map(x=>box([0.035,0.4,0.035],[x,0.3,-0.3],C.metal)),
    box([0.5,0.035,0.8],[0,0.17,0],C.metal),
    ...[-0.25,0.25].flatMap(x=>Array.from({length:8},(_,i)=>box([0.018,0.44,0.018],[x,0.69,-0.35+i*0.1],C.metal))),
    ...[0.47,0.68,0.9].flatMap(y=>[
    box([0.52,0.018,0.018],[0,y,0.36],C.metal),
    box([0.52,0.018,0.018],[0,y,-0.36],C.metal),
    ...[-0.25,0.25].map(x=>box([0.018,0.018,0.74],[x,y,0],C.metal))]),
    ...[-0.2,-0.1,0,0.1,0.2].flatMap(x=>[
    box([0.015,0.015,0.72],[x,0.47,0],C.metal),
    ...[-0.36,0.36].map(z=>box([0.015,0.43,0.015],[x,0.69,z],C.metal))]),
    box([0.55,0.055,0.065],[0,0.98,-0.43],'#526759'),
    ...[-0.24,0.24].map(x=>box([0.03,0.14,0.1],[x,0.93,-0.39],C.metal))
  ],
})
