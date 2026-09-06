import { box, sphere, colors as C, defineProp } from '../primitives.js'

export default defineProp({
  assetId: 'prop.mattress', name: '遗弃床垫',
  zones: ["city","village"], tags: ["furniture","bedding","debris"],
  footprint: { width: 0.95, depth: 2.05 },
}, {
  weathered: () => [
    box([0.9,0.19,2],[0,0.095,0],'#8f8973'),
    box([0.91,0.022,2.01],[0,0.16,0],'#aaa28a'),
    ...[-0.65,-0.25,0.25,0.65].flatMap(z=>[-0.22,0.22].map(x=>sphere([0.06,0.018,0.06],[x,0.193,z],'#6f6b5a'))),
    box([0.24,0.004,0.41],[-0.21,0.192,-0.53],'#6f715c',[0,0.15,0])
  ],
})
