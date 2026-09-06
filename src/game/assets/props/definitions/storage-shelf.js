import { box, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.storage-shelf', name: '仓储货架',
  zones: ["city","industrial","village"], tags: ["storage","modular"],
  footprint: { width: 1.25, depth: 0.65 },
  sockets: [{ id: 'left', position: [-0.625,0,0], facing: [-1,0,0] }, { id: 'right', position: [0.625,0,0], facing: [1,0,0] }],
}, {
  weathered: () => [
    ...[-0.6,0.6].flatMap(x=>[-0.28,0.28].map(z=>box([0.045,1.9,0.045],[x,0.95,z],C.metal))),
    ...[0.15,0.7,1.25,1.8].flatMap(y=>[
    box([1.2,0.045,0.6],[0,y,0],'#848371'),
    box([1.22,0.075,0.035],[0,y-0.02,0.3],C.rust)]),
    ...[-1,1].map(sign=>box([0.026,2.18,0.026],[0,0.95,-0.28],C.metal,[0,0,sign*0.57]))
  ],
})
