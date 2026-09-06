import { box, cylinder, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.suitcase', name: '遗弃行李箱',
  zones: ["city","village","roadside"], tags: ["container","evacuation"],
  footprint: { width: 0.52, depth: 0.32 },
}, {
  weathered: () => [
 box([0.48,0.66,0.28],[0,0.36,0],'#78634f'),
 box([0.49,0.03,0.29],[0,0.52,0],C.dark),
 ...[-0.15,0.15].map(x=>box([0.035,0.64,0.29],[x,0.36,0],C.dark)),
 box([0.23,0.03,0.065],[0,0.75,0],C.dark),
 ...[-0.1,0.1].map(x=>box([0.03,0.06,0.05],[x,0.72,0],C.metal)),
 ...[-0.17,0.17].map(x=>sphere([0.09,0.09,0.09],[x,0.045,-0.08],C.dark)),
 box([0.1,0.13,0.012],[0.08,0.4,0.151],'#b4aa8d',[0,0,0.15])
  ],
})
