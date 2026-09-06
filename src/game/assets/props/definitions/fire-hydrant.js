import { cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.fire-hydrant', name: '消防栓',
  zones: ["city","industrial","village"], tags: ["utility","water"],
  footprint: { width: 0.65, depth: 0.45 },
}, {
  weathered: () => [
    cylinder([0.34,0.1,0.34],[0,0.05,0],C.metal),
    cylinder([0.22,0.62,0.22],[0,0.4,0],'#905848'),
    sphere([0.24,0.18,0.24],[0,0.74,0],'#905848'),
    cylinder([0.07,0.06,0.07],[0,0.85,0],C.metal),
    cylinder([0.15,0.53,0.15],[0,0.55,0],C.rust,[0,0,Math.PI/2]),
    ...[-0.28,0.28].map(x=>cylinder([0.19,0.06,0.19],[x,0.55,0],C.metal,[0,0,Math.PI/2])),
    cylinder([0.16,0.15,0.16],[0,0.39,0.14],C.metal,[Math.PI/2,0,0])
  ],
})
