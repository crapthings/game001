import { box, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.toolbox', name: '工具箱',
  zones: ["universal"], tags: ["container","tools"],
  footprint: { width: 0.55, depth: 0.3 },
}, {
  weathered: () => [
    box([0.5,0.2,0.26],[0,0.1,0],'#6f7968'),
    box([0.52,0.07,0.28],[0,0.235,0],C.metal),
    ...[-0.08,0.08].map(x=>box([0.025,0.065,0.045],[x,0.3,0],C.dark)),
    box([0.19,0.03,0.05],[0,0.34,0],C.dark),
    ...[-0.17,0.17].map(x=>box([0.045,0.07,0.018],[x,0.21,0.148],C.rust))
  ],
})
