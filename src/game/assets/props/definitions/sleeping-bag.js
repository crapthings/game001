import { box, cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.sleeping-bag', name: '睡袋',
  zones: ["universal"], tags: ["camp","bedding"],
  footprint: { width: 0.8, depth: 2 },
}, {
  weathered: () => [
 sphere([0.76,0.2,1.8],[0,0.11,-0.05],'#626d53'),
 sphere([0.62,0.15,0.45],[0,0.1,0.73],C.dark),
 box([0.022,0.015,1.5],[0.23,0.2,-0.13],'#a49b7a'),
 ...[-0.6,-0.25,0.1,0.45].map(z=>box([0.61,0.012,0.018],[0,0.205,z],'#4e5944'))
  ],
})
