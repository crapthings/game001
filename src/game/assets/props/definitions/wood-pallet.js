import { box, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.wood-pallet', name: '木托盘',
  zones: ["industrial","city","village"], tags: ["storage","modular"],
  footprint: { width: 1.2, depth: 0.8 },
}, {
  weathered: () => [
    ...[-0.5,0,0.5].flatMap(x=>[-0.29,0,0.29].map(z=>box([0.14,0.075,0.14],[x,0.0625,z],C.wood))),
    ...[-0.5,0,0.5].map(x=>box([0.15,0.025,0.8],[x,0.0125,0],'#60523f')),
    ...[-0.32,-0.16,0,0.16,0.32].map(z=>box([1.2,0.04,0.13],[0,0.12,z],C.wood)),
    ...[-0.5,0.5].flatMap(x=>[-0.32,0,0.32].map(z=>box([0.016,0.003,0.016],[x,0.142,z],C.dark)))
  ],
})
