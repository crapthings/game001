import { box, cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.medical-case', name: '医疗箱',
  zones: ["universal"], tags: ["container","medical"],
  footprint: { width: 0.5, depth: 0.32 },
}, {
  weathered: () => [
 box([0.46,0.28,0.3],[0,0.14,0],'#b4afa0'),
 box([0.48,0.035,0.32],[0,0.28,0],'#797f70'),
 box([0.2,0.035,0.07],[0,0.345,0],C.dark),
 ...[-0.085,0.085].map(x=>box([0.03,0.06,0.06],[x,0.31,0],C.dark)),
 box([0.19,0.055,0.012],[0,0.15,0.157],'#517264'),
 box([0.055,0.16,0.012],[0,0.15,0.158],'#517264')
  ],
})
