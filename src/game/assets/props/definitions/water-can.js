import { box, cylinder, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.water-can', name: '饮水桶',
  zones: ["universal"], tags: ["container","water","camp"],
  footprint: { width: 0.34, depth: 0.3 },
}, {
  weathered: () => [
    box([0.3,0.4,0.25],[0,0.2,0],'#a3a48c'),
    box([0.23,0.07,0.22],[0,0.425,0],'#929780'),
    cylinder([0.075,0.045,0.075],[-0.075,0.48,0],'#536b65'),
    ...[-0.05,0.09].map(x=>box([0.025,0.07,0.04],[x,0.49,0],'#929780')),
    box([0.165,0.025,0.04],[0.02,0.535,0],'#929780'),
    ...[-0.075,0,0.075].map(x=>box([0.012,0.25,0.016],[x,0.21,0.13],'#858c79'))
  ],
})
