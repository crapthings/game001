import { box, cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.traffic-cone', name: '交通锥',
  zones: ["city","industrial","roadside"], tags: ["traffic","warning"],
  footprint: { width: 0.44, depth: 0.44 },
}, {
  weathered: () => [
 box([0.44,0.06,0.44],[0,0.03,0],C.dark),
 cylinder([0.3,0.56,0.055],[0,0.34,0],'#ac6037'),
 cylinder([0.194,0.12,0.141],[0,0.365,0],'#c3baa0')
  ],
})
