import { box, cylinder, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.ac-unit', name: '空调外机',
  zones: ["city","village","industrial"], tags: ["utility","wall"],
  footprint: { width: 0.9, depth: 0.4 },
}, {
  weathered: () => [
    box([0.82,0.53,0.32],[0,0.325,0],'#a5a492'),
    ...[-0.31,0.31].map(x=>box([0.09,0.06,0.36],[x,0.03,0],C.rust)),
    cylinder([0.39,0.015,0.39],[-0.14,0.33,0.17],C.dark,[Math.PI/2,0,0]),
    ...[-0.12,0,0.12].map(y=>box([0.38,0.016,0.024],[-0.14,0.33+y,0.19],C.metal)),
    ...[-0.26,-0.14,-0.02].map(x=>box([0.016,0.36,0.024],[x,0.33,0.19],C.metal)),
    ...Array.from({length:6},(_,i)=>box([0.15,0.023,0.02],[0.27,0.18+i*0.055,0.17],C.dark))
  ],
})
