import { box, cylinder, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.drainpipe', name: '排水管段',
  zones: ["city","village","industrial"], tags: ["utility","wall","modular"],
  footprint: { width: 0.26, depth: 0.26 },
  sockets: [{ id: 'bottom', position: [0,0,0], facing: [0,-1,0] }, { id: 'top', position: [0,2,0], facing: [0,1,0] }],
}, {
  weathered: () => [
    cylinder([0.13,2,0.13],[0,1,0],C.metal),
    ...[0.06,1.94].map(y=>cylinder([0.16,0.1,0.16],[0,y,0],C.rust)),
    ...[0.4,1.6].flatMap(y=>[
    box([0.23,0.035,0.045],[0,y,-0.06],C.rust),
    box([0.06,0.035,0.12],[0,y,-0.11],C.metal)])
  ],
})
